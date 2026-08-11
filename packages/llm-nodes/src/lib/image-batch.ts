/**
 * Shared Image Batch (OpenAI / Gemini) submit → short poll → suspend path.
 *
 * Provider Batch jobs can take up to ~24h but usually finish in minutes.
 * We poll in-run for 5 minutes so the image flows through the graph; if it
 * is still queued we suspend with a durable `batchId` for Check / auto-poll.
 */

import { WorkflowSuspendedError } from "@nodetool-ai/kernel";
import type {
  ImageBatchJob,
  ImageBatchSubmitParams
} from "@nodetool-ai/runtime";
import {
  IMAGE_BATCH_KIND,
  IMAGE_BATCH_QUICK_POLL_MS,
  IMAGE_BATCH_FAST_POLL_MS,
  IMAGE_BATCH_SUSPEND_REASON,
  type ImageBatchProviderId,
  type ImageBatchSuspendState
} from "@nodetool-ai/runtime";

export {
  IMAGE_BATCH_KIND,
  IMAGE_BATCH_QUICK_POLL_MS,
  IMAGE_BATCH_SUSPEND_REASON,
  readImageBatchSuspendState
} from "@nodetool-ai/runtime";
export type {
  ImageBatchProviderId,
  ImageBatchSuspendState
} from "@nodetool-ai/runtime";

export interface ImageBatchProvider {
  submitImageBatch(params: ImageBatchSubmitParams): Promise<ImageBatchJob>;
  getImageBatch(params: {
    batchId: string;
    signal?: AbortSignal;
  }): Promise<ImageBatchJob>;
  downloadImageBatchResults(params: {
    batchId: string;
    model?: string;
    signal?: AbortSignal;
  }): Promise<Uint8Array[]>;
}

const PENDING = new Set([
  "validating",
  "in_progress",
  "finalizing",
  "cancelling",
  "unknown"
]);

function defaultQuickPollMs(): number {
  const raw = process.env.NODETOOL_IMAGE_BATCH_QUICK_POLL_MS;
  if (raw != null && raw !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return IMAGE_BATCH_QUICK_POLL_MS;
}

/**
 * Submit an image Batch job. Poll briefly; return bytes if it finishes fast.
 * Otherwise throw {@link WorkflowSuspendedError} with durable batch state.
 */
export async function awaitImageBatchOrSuspend(opts: {
  provider: ImageBatchProvider;
  providerId: ImageBatchProviderId;
  nodeId: string;
  params: ImageBatchSubmitParams;
  quickPollMs?: number;
  onSubmitted?: (state: ImageBatchSuspendState) => Promise<void> | void;
}): Promise<Uint8Array[]> {
  const quickPollMs = Math.max(
    0,
    opts.quickPollMs ?? defaultQuickPollMs()
  );
  const job = await opts.provider.submitImageBatch(opts.params);
  const state: ImageBatchSuspendState = {
    kind: IMAGE_BATCH_KIND,
    provider: opts.providerId,
    batchId: job.batchId,
    model: opts.params.model,
    submittedAt: new Date().toISOString(),
    nodeId: opts.nodeId || undefined
  };
  await opts.onSubmitted?.(state);

  const start = Date.now();
  let current = job;

  while (PENDING.has(current.status) && Date.now() - start < quickPollMs) {
    const remaining = quickPollMs - (Date.now() - start);
    if (remaining <= 0) break;
    await new Promise<void>((resolve) =>
      setTimeout(resolve, Math.min(IMAGE_BATCH_FAST_POLL_MS, remaining))
    );
    current = await opts.provider.getImageBatch({
      batchId: job.batchId,
      signal: opts.params.signal
    });
  }

  if (current.status === "completed") {
    return opts.provider.downloadImageBatchResults({
      batchId: job.batchId,
      model: opts.params.model,
      signal: opts.params.signal
    });
  }

  if (
    current.status === "failed" ||
    current.status === "cancelled" ||
    current.status === "expired"
  ) {
    throw new Error(
      `Image batch '${job.batchId}' ended with status=${current.status}` +
        (current.error ? `: ${current.error}` : "")
    );
  }

  throw new WorkflowSuspendedError({
    nodeId: opts.nodeId || "unknown",
    reason: IMAGE_BATCH_SUSPEND_REASON,
    state: { ...state },
    metadata: {
      kind: IMAGE_BATCH_KIND,
      provider: opts.providerId,
      batchId: job.batchId,
      model: opts.params.model,
      nodeId: opts.nodeId || undefined
    }
  });
}
