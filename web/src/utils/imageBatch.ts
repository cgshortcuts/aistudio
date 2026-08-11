import type { QueryClient } from "@tanstack/react-query";
import type { Job } from "../stores/ApiTypes";
import useResultsStore from "../stores/ResultsStore";
import { useWorkflowAssetStore } from "../stores/WorkflowAssetStore";
import { useWorkspaceTabsStore } from "../stores/WorkspaceTabsStore";

export const IMAGE_BATCH_KIND = "image_batch";

/** Match the runtime 5-minute fast window, then slow polls. */
export const IMAGE_BATCH_QUICK_POLL_MS = 5 * 60_000;
export const IMAGE_BATCH_FAST_POLL_MS = 5_000;
export const IMAGE_BATCH_SLOW_POLL_MS = 30_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isImageBatchPreviewValue = (value: unknown): boolean =>
  isRecord(value) && value.kind === IMAGE_BATCH_KIND;

export const isImageBatchJob = (job: Job): boolean => {
  const meta = job.suspension_metadata;
  if (isRecord(meta) && meta.kind === IMAGE_BATCH_KIND) {
    return true;
  }
  const reason = job.suspension_reason ?? "";
  return /provider batch/i.test(reason) || /batch image/i.test(reason);
};

export const imageBatchPollIntervalMs = (jobs: Job[], now = Date.now()): number => {
  if (jobs.length === 0) {
    return IMAGE_BATCH_SLOW_POLL_MS;
  }
  let youngest = Number.POSITIVE_INFINITY;
  for (const job of jobs) {
    const meta = job.suspension_metadata;
    const submitted =
      (isRecord(meta) && typeof meta.submittedAt === "string"
        ? meta.submittedAt
        : null) ?? job.started_at;
    const ts = submitted ? Date.parse(submitted) : now;
    if (Number.isFinite(ts) && ts < youngest) {
      youngest = ts;
    }
  }
  if (!Number.isFinite(youngest)) {
    return IMAGE_BATCH_FAST_POLL_MS;
  }
  return now - youngest < IMAGE_BATCH_QUICK_POLL_MS
    ? IMAGE_BATCH_FAST_POLL_MS
    : IMAGE_BATCH_SLOW_POLL_MS;
};

export async function applyImageBatchComplete(opts: {
  queryClient: QueryClient;
  workflowId: string;
  jobId: string;
  nodeId: string | null | undefined;
  assetIds: string[];
}): Promise<void> {
  const { queryClient, workflowId, jobId, nodeId, assetIds } = opts;
  queryClient.invalidateQueries({ queryKey: ["jobs"] });
  queryClient.invalidateQueries({ queryKey: ["assets"] });
  queryClient.invalidateQueries({
    queryKey: ["assets", { job_id: jobId }]
  });
  if (nodeId) {
    queryClient.invalidateQueries({
      queryKey: ["assets", { node_id: nodeId }]
    });
  }
  if (workflowId) {
    try {
      await useWorkflowAssetStore.getState().loadWorkflowAssets(workflowId);
    } catch {
      // Listing is best-effort; the live upsert below still puts the image on the node.
    }
  }
  if (workflowId && nodeId && assetIds.length > 0) {
    const images = assetIds.map((id) => ({
      type: "image",
      uri: `asset://${id}.png`
    }));
    useResultsStore.getState().upsertLiveGeneration(workflowId, nodeId, jobId, {
      index: 0,
      status: "completed",
      outputs: {
        output: images.length === 1 ? images[0] : images
      }
    });
  }
}

export function openWorkflowForBatchResult(workflowId: string): void {
  useWorkspaceTabsStore.getState().openTab({
    type: "workflow",
    ref: workflowId,
    mode: "edit"
  });
}
