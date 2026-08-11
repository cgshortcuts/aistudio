/**
 * Generation params stamped onto auto-saved media assets so the asset
 * info panel can show what produced a file (prompt, model, cost, …).
 *
 * Keys are stable and intentional — the panel hides internal ones like
 * `generation_index`. Keep the bag small; binary and nested refs stay out.
 */

import sharp from "sharp";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MediaToolingMissingError, probeDurationMs } from "./media.js";

/** Char cap for the prompt stored in a media asset's metadata. */
export const PROMPT_METADATA_CAP = 8_000;

/**
 * Well-known keys written into `asset.metadata` for a generated media file.
 * All fields are optional — stamp only what the create path knows.
 */
export interface GenerationAssetMetadata {
  prompt?: string;
  model?: string;
  provider?: string;
  /** USD (or other) amount for this generation. */
  cost?: number;
  cost_currency?: string;
  /** Wall-clock time to generate, in milliseconds. */
  duration_ms?: number;
  /** Requested generation size label (`1080p`, `2K`, …). */
  resolution?: string;
  /** Requested pixel width when known. */
  width?: number;
  /** Requested pixel height when known. */
  height?: number;
  aspect_ratio?: string;
  /** Actual pixel width of the saved file. */
  pixel_width?: number;
  /** Actual pixel height of the saved file. */
  pixel_height?: number;
  /** Replay dedupe slot — not shown in the info panel. */
  generation_index?: number;
}

const HIDDEN_METADATA_KEYS = new Set(["generation_index"]);

/** Keys the info panel should not render as raw dump rows. */
export function isHiddenGenerationMetadataKey(key: string): boolean {
  return HIDDEN_METADATA_KEYS.has(key) || key.startsWith("_");
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/**
 * Pull provider + model id out of a model-slot object
 * (`{ type: "image_model", id, name, provider }`) or return null.
 */
export function readModelSlot(
  value: unknown
): { model: string; provider?: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const v = value as Record<string, unknown>;
  const id = asNonEmptyString(v.id);
  const name = asNonEmptyString(v.name);
  const model = id ?? name;
  if (!model) return null;
  const provider = asNonEmptyString(v.provider);
  return provider ? { model, provider } : { model };
}

/**
 * Build generation metadata from resolved scalar (and flattened model)
 * input properties. Caps the prompt. Omits empty fields.
 */
export function buildGenerationMetadata(
  properties: Record<string, unknown> | undefined | null,
  extras?: Partial<GenerationAssetMetadata>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (properties) {
    const promptRaw = asNonEmptyString(properties.prompt);
    if (promptRaw) {
      out.prompt =
        promptRaw.length > PROMPT_METADATA_CAP
          ? promptRaw.slice(0, PROMPT_METADATA_CAP)
          : promptRaw;
    }

    const modelSlot =
      readModelSlot(properties.model) ??
      readModelSlot(properties.image_model) ??
      readModelSlot(properties.video_model) ??
      readModelSlot(properties.tts_model) ??
      readModelSlot(properties.music_model);

    const modelFromString =
      asNonEmptyString(properties.model) ??
      asNonEmptyString(properties.model_id);
    const providerFromString = asNonEmptyString(properties.provider);

    if (modelSlot) {
      out.model = modelSlot.model;
      if (modelSlot.provider) out.provider = modelSlot.provider;
    } else if (modelFromString) {
      out.model = modelFromString;
    }
    if (!out.provider && providerFromString) {
      out.provider = providerFromString;
    }

    const resolution = asNonEmptyString(properties.resolution);
    if (resolution) out.resolution = resolution;

    const aspectRatio = asNonEmptyString(properties.aspect_ratio);
    if (aspectRatio) out.aspect_ratio = aspectRatio;

    const width = asFiniteNumber(properties.width);
    if (width !== undefined) out.width = width;
    const height = asFiniteNumber(properties.height);
    if (height !== undefined) out.height = height;

    // Image-edit / i2v often use target_width / target_height.
    if (out.width === undefined) {
      const tw = asFiniteNumber(properties.target_width);
      if (tw !== undefined) out.width = tw;
    }
    if (out.height === undefined) {
      const th = asFiniteNumber(properties.target_height);
      if (th !== undefined) out.height = th;
    }
  }

  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      if (value === undefined || value === null) continue;
      if (typeof value === "string" && value.trim().length === 0) continue;
      out[key] = value;
    }
  }

  return out;
}

/**
 * Probe pixel dimensions from image bytes via sharp. Returns null on
 * failure (non-image, corrupt, …).
 */
export async function probeImageDimensions(
  bytes: Uint8Array
): Promise<{ width: number; height: number } | null> {
  try {
    const meta = await sharp(Buffer.from(bytes), { failOn: "none" }).metadata();
    if (
      typeof meta.width === "number" &&
      meta.width > 0 &&
      typeof meta.height === "number" &&
      meta.height > 0
    ) {
      return { width: meta.width, height: meta.height };
    }
  } catch {
    // Non-image or unreadable — leave dimensions unset.
  }
  return null;
}

/**
 * Probe duration (seconds) and optionally dimensions for video/audio bytes
 * via a temp file + ffprobe. Best-effort: missing ffprobe or probe failure
 * returns nulls rather than throwing.
 */
export async function probeMediaFileMeta(
  bytes: Uint8Array,
  ext: string
): Promise<{
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
}> {
  const empty = {
    durationSeconds: null as number | null,
    width: null as number | null,
    height: null as number | null
  };
  let dir: string | null = null;
  try {
    dir = await mkdtemp(join(tmpdir(), "nodetool-probe-"));
    const filePath = join(dir, `media.${ext.replace(/^\./, "") || "bin"}`);
    await writeFile(filePath, bytes);
    const durationMs = await probeDurationMs(filePath);
    let width: number | null = null;
    let height: number | null = null;
    try {
      const { execFile } = await import("node:child_process");
      const { promisify } = await import("node:util");
      const exec = promisify(execFile);
      const { stdout } = await exec("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "csv=p=0:s=x",
        filePath
      ]);
      const [wStr, hStr] = stdout.trim().split("x");
      const w = Number(wStr);
      const h = Number(hStr);
      if (Number.isFinite(w) && w > 0) width = w;
      if (Number.isFinite(h) && h > 0) height = h;
    } catch {
      // No video stream or ffprobe failed — dimensions stay null.
    }
    return {
      durationSeconds:
        durationMs != null && Number.isFinite(durationMs)
          ? durationMs / 1000
          : null,
      width,
      height
    };
  } catch (err) {
    if (err instanceof MediaToolingMissingError) {
      return empty;
    }
    return empty;
  } finally {
    if (dir) {
      await rm(dir, { recursive: true, force: true }).catch(() => {
        // Temp cleanup is best-effort.
      });
    }
  }
}

/**
 * Enrich a metadata bag with actual pixel size / media duration from the
 * saved bytes. Mutates nothing — returns a new object.
 */
export async function enrichMetadataFromBytes(
  metadata: Record<string, unknown>,
  bytes: Uint8Array,
  contentType: string
): Promise<{
  metadata: Record<string, unknown>;
  durationSeconds: number | null;
}> {
  const next = { ...metadata };
  let durationSeconds: number | null = null;

  if (contentType.startsWith("image/")) {
    const dims =
      typeof next.pixel_width === "number" &&
      typeof next.pixel_height === "number"
        ? null
        : await probeImageDimensions(bytes);
    if (dims) {
      next.pixel_width = dims.width;
      next.pixel_height = dims.height;
      // Fall back requested size to actual when the request didn't pin pixels.
      if (typeof next.width !== "number") next.width = dims.width;
      if (typeof next.height !== "number") next.height = dims.height;
    }
  } else if (
    contentType.startsWith("video/") ||
    contentType.startsWith("audio/")
  ) {
    const ext = contentType.includes("webm")
      ? "webm"
      : contentType.includes("mp4")
        ? "mp4"
        : contentType.includes("wav")
          ? "wav"
          : contentType.includes("mpeg") || contentType.includes("mp3")
            ? "mp3"
            : "bin";
    const probed = await probeMediaFileMeta(bytes, ext);
    durationSeconds = probed.durationSeconds;
    if (contentType.startsWith("video/")) {
      if (probed.width != null) next.pixel_width = probed.width;
      if (probed.height != null) next.pixel_height = probed.height;
      if (typeof next.width !== "number" && probed.width != null) {
        next.width = probed.width;
      }
      if (typeof next.height !== "number" && probed.height != null) {
        next.height = probed.height;
      }
    }
  }

  return { metadata: next, durationSeconds };
}
