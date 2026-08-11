/**
 * Persist and reclaim provider image-Batch ids on Job rows.
 *
 * `recordImageBatch` writes the durable `batchId` while the node is still
 * running (so a disconnect cannot lose it). `parkOrphanImageBatchJob` turns
 * a running row with that metadata into a suspended Batch job when nothing
 * is left executing it.
 */

import { Job } from "@nodetool-ai/models";
import {
  IMAGE_BATCH_KIND,
  IMAGE_BATCH_SUSPEND_REASON,
  readImageBatchSuspendState,
  type ImageBatchSuspendState
} from "@nodetool-ai/runtime";

export function readImageBatchStateFromJob(
  job: Job
): ImageBatchSuspendState | null {
  return (
    readImageBatchSuspendState(
      job.suspension_state_json,
      job.suspension_metadata_json
    ) ?? readImageBatchSuspendState(job.metadata_json)
  );
}

export async function recordImageBatchModelInterface(args: {
  userId: string;
  jobId: string;
  nodeId: string;
  state: Record<string, unknown>;
}): Promise<void> {
  const job = (await Job.get(args.jobId)) as Job | null;
  if (!job || job.user_id !== args.userId) {
    return;
  }
  job.metadata_json = {
    ...(job.metadata_json ?? {}),
    ...args.state,
    kind: IMAGE_BATCH_KIND,
    nodeId: args.nodeId || undefined
  };
  await job.save();
}

export function parkImageBatchJob(
  job: Job,
  state: ImageBatchSuspendState
): void {
  const nodeId = state.nodeId || job.suspended_node_id || "unknown";
  job.markSuspended(
    nodeId,
    IMAGE_BATCH_SUSPEND_REASON,
    { ...state, nodeId },
    {
      kind: IMAGE_BATCH_KIND,
      provider: state.provider,
      batchId: state.batchId,
      model: state.model,
      nodeId
    }
  );
}
