/**
 * Durable shape for a suspended provider image Batch job.
 * Written into Job.suspension_state_json / suspension_metadata_json so the
 * Jobs queue can Check after app restart.
 */

export const IMAGE_BATCH_KIND = "image_batch" as const;

/** Shown in the Jobs queue while waiting on the provider. */
export const IMAGE_BATCH_SUSPEND_REASON =
  "Provider Batch — checking until the image is ready. Can take a few minutes.";

/** Poll in-run this long so typical Batch jobs finish in the graph. */
export const IMAGE_BATCH_QUICK_POLL_MS = 5 * 60_000;

/** In-run / UI poll interval while the job is younger than 5 minutes. */
export const IMAGE_BATCH_FAST_POLL_MS = 5_000;

/** UI poll interval after the first 5 minutes. */
export const IMAGE_BATCH_SLOW_POLL_MS = 30_000;

export type ImageBatchProviderId = "openai" | "gemini";

export interface ImageBatchSuspendState {
  kind: typeof IMAGE_BATCH_KIND;
  provider: ImageBatchProviderId;
  batchId: string;
  model: string;
  submittedAt: string;
  nodeId?: string;
}

function isImageBatchSuspendState(
  value: unknown
): value is ImageBatchSuspendState {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return (
    rec.kind === IMAGE_BATCH_KIND &&
    (rec.provider === "openai" || rec.provider === "gemini") &&
    typeof rec.batchId === "string" &&
    rec.batchId.length > 0 &&
    typeof rec.model === "string"
  );
}

export function readImageBatchSuspendState(
  state: unknown,
  metadata?: unknown
): ImageBatchSuspendState | null {
  if (isImageBatchSuspendState(state)) return state;
  if (isImageBatchSuspendState(metadata)) return metadata;
  return null;
}
