/**
 * BytePlus ModelArk video-generation HTTP helpers.
 *
 * Wire contract (ap-southeast ModelArk):
 *  - Base: https://ark.ap-southeast.bytepluses.com/api/v3
 *  - Auth: Authorization: Bearer <BYTEPLUS_API_KEY|ARK_API_KEY>
 *  - Create: POST /contents/generations/tasks
 *  - Poll:   GET  /contents/generations/tasks/{id}
 *  - Result: content.video_url on status === succeeded
 *
 * Submit is never retried — a 429/5xx may have already created a billed task.
 */

import { resolveModelId } from "./byteplus-models.js";

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

export const DEFAULT_ARK_BASE =
  "https://ark.ap-southeast.bytepluses.com/api/v3";

export const CREATE_TASK_PATH = "/contents/generations/tasks";

export function arkBaseUrl(): string {
  const fromEnv = process.env.BYTEPLUS_ARK_BASE_URL?.trim();
  return (fromEnv || DEFAULT_ARK_BASE).replace(/\/$/, "");
}

export function taskPath(id: string): string {
  return `${CREATE_TASK_PATH}/${encodeURIComponent(id)}`;
}

export function getApiKey(secrets: Record<string, string> | undefined): string {
  const key =
    (secrets && secrets.BYTEPLUS_API_KEY) ||
    (secrets && secrets.ARK_API_KEY) ||
    process.env.BYTEPLUS_API_KEY ||
    process.env.ARK_API_KEY ||
    "";
  if (!key.trim()) {
    throw new Error(
      "BYTEPLUS_API_KEY is not configured (ARK_API_KEY is also accepted)"
    );
  }
  return key.trim();
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };
}

export function retryAfterMs(header: string | null, fallback: number): number {
  if (!header) return fallback;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const when = Date.parse(header);
  if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
  return fallback;
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  maxAttempts = 6
): Promise<Response> {
  let delay = 1000;
  let last: Response | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const resp = await fetch(url, init);
    if (!RETRYABLE_STATUS.has(resp.status)) return resp;
    last = resp;
    if (attempt === maxAttempts) break;
    const wait = retryAfterMs(resp.headers.get("Retry-After"), delay);
    await sleep(wait);
    delay = Math.min(delay * 2, 30000);
  }
  return last as Response;
}

export async function arkDownload(url: string): Promise<Uint8Array> {
  const res = await fetchWithRetry(url);
  if (!res.ok) {
    throw new Error(
      `BytePlus download failed: HTTP ${res.status} fetching ${url}`
    );
  }
  return new Uint8Array(await res.arrayBuffer());
}

export type ContentItem =
  | { type: "text"; text: string }
  | {
      type: "image_url";
      image_url: { url: string };
      role?: string;
    }
  | {
      type: "video_url";
      video_url: { url: string };
      role?: string;
    }
  | {
      type: "audio_url";
      audio_url: { url: string };
      role?: string;
    };

export interface ArkTaskBody {
  model: string;
  content: ContentItem[];
  ratio?: string;
  resolution?: string;
  duration?: number;
  generate_audio?: boolean;
  watermark?: boolean;
  seed?: number;
  [key: string]: unknown;
}

const TOP_LEVEL_KEYS = new Set([
  "ratio",
  "resolution",
  "duration",
  "generate_audio",
  "watermark",
  "seed",
  "camera_fixed",
  "return_last_frame"
]);

/**
 * Map node field bag → ModelArk create-task body.
 * Asset fields become `content[]` entries; scalars stay top-level.
 */
export function buildTaskBody(
  modelId: string,
  fields: Record<string, unknown>,
  modelIdEnv?: string | null
): ArkTaskBody {
  const content: ContentItem[] = [];
  const prompt = fields.prompt;
  if (typeof prompt === "string" && prompt.trim()) {
    content.push({ type: "text", text: prompt });
  }

  const pushImage = (url: string | null | undefined, role?: string): void => {
    if (!url) return;
    const item: ContentItem = {
      type: "image_url",
      image_url: { url }
    };
    if (role) (item as { role?: string }).role = role;
    content.push(item);
  };

  // I2V first/last frame (accept Atlas-style `image` / `last_image` aliases).
  const first =
    (typeof fields.first_frame === "string" && fields.first_frame) ||
    (typeof fields.image === "string" && fields.image) ||
    null;
  pushImage(first || undefined, "first_frame");

  const last =
    (typeof fields.last_frame === "string" && fields.last_frame) ||
    (typeof fields.last_image === "string" && fields.last_image) ||
    null;
  if (last) pushImage(last, "last_frame");

  const refImages = fields.reference_images;
  if (Array.isArray(refImages)) {
    for (const url of refImages) {
      if (typeof url === "string" && url) {
        pushImage(url, "reference_image");
      }
    }
  }

  const refVideos = fields.reference_videos;
  if (Array.isArray(refVideos)) {
    for (const url of refVideos) {
      if (typeof url === "string" && url) {
        content.push({
          type: "video_url",
          video_url: { url },
          role: "reference_video"
        });
      }
    }
  }

  const refAudios = fields.reference_audios;
  if (Array.isArray(refAudios)) {
    for (const url of refAudios) {
      if (typeof url === "string" && url) {
        content.push({
          type: "audio_url",
          audio_url: { url },
          role: "reference_audio"
        });
      }
    }
  }

  if (content.length === 0) {
    throw new Error(
      "BytePlus Seedance: provide a prompt and/or at least one media reference"
    );
  }

  const body: ArkTaskBody = {
    model: resolveModelId(modelId, modelIdEnv),
    content
  };

  for (const key of TOP_LEVEL_KEYS) {
    const v = fields[key];
    if (v === undefined || v === null) continue;
    if (key === "duration" || key === "seed") {
      const n = typeof v === "number" ? v : parseInt(String(v), 10);
      if (!Number.isNaN(n)) body[key] = n;
      continue;
    }
    if (key === "generate_audio" || key === "watermark" || key === "camera_fixed" || key === "return_last_frame") {
      body[key] = Boolean(v);
      continue;
    }
    if (typeof v === "string" && v !== "") body[key] = v;
  }

  return body;
}

export async function arkSubmit(
  apiKey: string,
  body: ArkTaskBody
): Promise<string> {
  const url = `${arkBaseUrl()}${CREATE_TASK_PATH}`;
  // Submit is not idempotent — never retry.
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data: { id?: string; error?: { message?: string }; message?: string } | null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error(`BytePlus submit ${res.status}: ${text.slice(0, 500)}`);
  }
  const id = data?.id;
  if (!id) {
    throw new Error(
      `BytePlus: no task id in submit response: ${text.slice(0, 500)}`
    );
  }
  return id;
}

export interface ArkPollResult {
  id?: string;
  status?: string;
  content?: {
    video_url?: string;
    last_frame_url?: string;
  };
  error?: { message?: string; code?: string };
  message?: string;
}

const SUCCESS_STATUS = new Set(["succeeded", "success", "completed", "complete"]);
const FAILURE_STATUS = new Set(["failed", "error", "canceled", "cancelled"]);

export async function arkPoll(
  apiKey: string,
  taskId: string,
  opts: { pollInterval?: number; maxAttempts?: number } = {}
): Promise<ArkPollResult> {
  const pollInterval = opts.pollInterval ?? 5000;
  const maxAttempts = opts.maxAttempts ?? 600;
  const url = `${arkBaseUrl()}${taskPath(taskId)}`;

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetchWithRetry(url, { headers: authHeaders(apiKey) });
    const text = await res.text();
    let data: ArkPollResult | null;
    try {
      data = JSON.parse(text) as ArkPollResult;
    } catch {
      data = null;
    }
    const status = String(data?.status ?? "").toLowerCase();

    if (SUCCESS_STATUS.has(status)) {
      return data ?? {};
    }
    if (FAILURE_STATUS.has(status)) {
      const msg =
        data?.error?.message || data?.message || text.slice(0, 500);
      throw new Error(`BytePlus job failed: ${msg} (taskId: ${taskId})`);
    }
    if (!res.ok) {
      throw new Error(`BytePlus poll ${res.status}: ${text.slice(0, 500)}`);
    }
    await sleep(pollInterval);
  }
  throw new Error(`BytePlus job timed out (taskId: ${taskId})`);
}

export function pickVideoUrl(result: ArkPollResult): string {
  const url = result.content?.video_url;
  if (typeof url === "string" && url) return url;
  throw new Error(
    `No video_url in BytePlus result: ${JSON.stringify(result).slice(0, 500)}`
  );
}

/** Create → poll → download helper used by nodes and the BaseProvider. */
export async function arkGenerateVideo(
  apiKey: string,
  body: ArkTaskBody,
  opts: { pollInterval?: number; maxAttempts?: number } = {}
): Promise<Uint8Array> {
  const taskId = await arkSubmit(apiKey, body);
  const result = await arkPoll(apiKey, taskId, opts);
  const videoUrl = pickVideoUrl(result);
  return arkDownload(videoUrl);
}
