/**
 * Format and extract generation metadata for the asset info panel.
 */

import type { Asset } from "../../stores/ApiTypes";

export interface GenerationInfoRow {
  label: string;
  value: string;
  /** Raw string copied on click (defaults to `value`). */
  copyValue?: string;
  /** When set, click opens this path in the file explorer instead of copying. */
  openPath?: string;
}

const HIDDEN_KEYS = new Set([
  "generation_index",
  "text",
  "json",
  "nodetool_entity"
]);

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return null;
}

function formatCost(cost: unknown, currency: unknown): string | null {
  if (typeof cost !== "number" || !Number.isFinite(cost)) return null;
  const cur =
    typeof currency === "string" && currency.trim()
      ? currency.trim().toUpperCase()
      : "USD";
  if (cur === "USD") {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(cost < 1 ? 3 : 2)}`;
  }
  return `${cost} ${cur}`;
}

function formatDurationMs(ms: unknown): string | null {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return null;
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  const mins = Math.floor(seconds / 60);
  const rem = Math.round(seconds % 60);
  return `${mins}m ${rem}s`;
}

function formatDimensions(
  width: unknown,
  height: unknown
): string | null {
  if (
    typeof width === "number" &&
    typeof height === "number" &&
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  ) {
    return `${Math.round(width)} × ${Math.round(height)}`;
  }
  return null;
}

/**
 * Build the labelled generation rows for an asset. Empty fields are omitted.
 * Unknown leftover metadata keys are appended as raw dump rows (except
 * internal / hidden ones).
 */
export function buildGenerationInfoRows(asset: Asset): GenerationInfoRow[] {
  const md = (asset.metadata ?? {}) as Record<string, unknown>;
  const rows: GenerationInfoRow[] = [];
  const used = new Set<string>();

  const prompt = asString(md.prompt);
  if (prompt) {
    rows.push({ label: "Prompt", value: prompt });
    used.add("prompt");
  }

  const model = asString(md.model);
  if (model) {
    rows.push({ label: "Model", value: model });
    used.add("model");
  }

  const provider = asString(md.provider);
  if (provider) {
    rows.push({ label: "Provider", value: provider });
    used.add("provider");
  }

  const cost = formatCost(md.cost, md.cost_currency);
  if (cost) {
    rows.push({
      label: "Cost",
      value: cost,
      copyValue: String(md.cost)
    });
    used.add("cost");
    used.add("cost_currency");
  }

  const time = formatDurationMs(md.duration_ms);
  if (time) {
    rows.push({
      label: "Time",
      value: time,
      copyValue: String(md.duration_ms)
    });
    used.add("duration_ms");
  }

  const resolution = asString(md.resolution);
  if (resolution) {
    rows.push({ label: "Resolution", value: resolution });
    used.add("resolution");
  }

  const aspect = asString(md.aspect_ratio);
  if (aspect) {
    rows.push({ label: "Aspect", value: aspect });
    used.add("aspect_ratio");
  }

  const requested = formatDimensions(md.width, md.height);
  const pixels = formatDimensions(md.pixel_width, md.pixel_height);
  if (pixels) {
    rows.push({ label: "Dimensions", value: pixels });
    used.add("pixel_width");
    used.add("pixel_height");
    // Hide requested size when it matches actual pixels.
    if (requested && requested !== pixels) {
      rows.push({ label: "Requested size", value: requested });
    }
    used.add("width");
    used.add("height");
  } else if (requested) {
    rows.push({ label: "Dimensions", value: requested });
    used.add("width");
    used.add("height");
  }

  const localPath =
    typeof asset.local_path === "string" && asset.local_path.trim()
      ? asset.local_path.trim()
      : null;
  if (localPath) {
    rows.push({
      label: "Location",
      value: localPath,
      openPath: localPath
    });
  }

  for (const [key, val] of Object.entries(md)) {
    if (used.has(key) || HIDDEN_KEYS.has(key) || key.startsWith("_")) {
      continue;
    }
    const text = asString(val);
    if (!text) continue;
    rows.push({ label: key, value: text });
  }

  return rows;
}
