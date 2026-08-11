/**
 * Jobs router — migrated from REST `/api/jobs*`.
 *
 * User ownership is enforced on every procedure — a job whose `user_id`
 * doesn't match `ctx.userId` is indistinguishable from a missing one. The
 * same rule applies to the trigger-registration procedures below, which
 * replace the old `GET/POST /api/jobs/triggers/*` REST stubs.
 */

import { z } from "zod";
import { Job, RunEvent, TriggerRegistration, getSecret } from "@nodetool-ai/models";
import type { Job as JobModel } from "@nodetool-ai/models";
import {
  OpenAIProvider,
  GeminiProvider,
  IMAGE_BATCH_KIND,
  IMAGE_BATCH_SUSPEND_REASON
} from "@nodetool-ai/runtime";
import { ApiErrorCode } from "../../error-codes.js";
import { router } from "../index.js";
import { protectedProcedure } from "../middleware.js";
import { throwApiError } from "../error-formatter.js";
import { rearmTrigger } from "../../triggers/settle.js";
import { createAssetModelInterface } from "../../lib/asset-model-interface.js";
import {
  parkImageBatchJob,
  readImageBatchStateFromJob
} from "../../lib/image-batch-job.js";
import { jobRunRegistry } from "../../job-run-registry.js";
import {
  listInput,
  listOutput,
  getInput,
  jobResponse,
  cancelInput,
  cancelOutput,
  checkBatchInput,
  checkBatchOutput,
  type JobResponse,
  type BackgroundJobResponse
} from "@nodetool-ai/protocol/api-schemas/jobs.js";

function toJobResponse(job: JobModel): JobResponse {
  const batchMeta =
    job.suspension_metadata_json ??
    (job.metadata_json?.kind === IMAGE_BATCH_KIND ? job.metadata_json : null);
  return {
    id: job.id,
    user_id: job.user_id,
    job_type: "workflow" as const,
    status: job.status,
    name: job.name ?? null,
    workflow_id: job.workflow_id,
    started_at: job.started_at ?? null,
    finished_at: job.finished_at ?? null,
    error: job.error ?? null,
    cost: job.cost ?? null,
    suspension_reason: job.suspension_reason ?? null,
    suspended_node_id: job.suspended_node_id ?? null,
    suspension_metadata: batchMeta
  };
}

function toBackgroundJobResponse(job: JobModel): BackgroundJobResponse {
  return {
    job_id: job.id,
    status: job.status,
    workflow_id: job.workflow_id,
    created_at: job.started_at ?? null,
    is_running: job.status === "running" || job.status === "scheduled",
    is_completed:
      job.status === "completed" ||
      job.status === "failed" ||
      job.status === "cancelled"
  };
}

export interface TriggerRegistrationResponse {
  id: string;
  workflow_id: string;
  node_id: string;
  kind: string;
  enabled: boolean;
  last_fired_at: string | null;
  last_error: string | null;
  /** Non-null only when the dispatcher disarmed it; see `settle.ts`. */
  disabled_reason: string | null;
  consecutive_failures: number;
  run_count: number;
  expires_at: string | null;
  max_runs: number | null;
}

function toTriggerRegistrationResponse(
  registration: TriggerRegistration
): TriggerRegistrationResponse {
  return {
    id: registration.id,
    workflow_id: registration.workflow_id,
    node_id: registration.node_id,
    kind: registration.kind,
    enabled: registration.enabled === 1,
    last_fired_at: registration.last_fired_at,
    last_error: registration.last_error,
    disabled_reason: registration.disabled_reason,
    consecutive_failures: registration.consecutive_failures,
    run_count: registration.run_count,
    expires_at: registration.expires_at,
    max_runs: registration.max_runs
  };
}

const triggerIdInput = z.object({ id: z.string() });

async function requireOwnedRegistration(
  id: string,
  userId: string
): Promise<TriggerRegistration> {
  const registration = (await TriggerRegistration.get(
    id
  )) as TriggerRegistration | null;
  if (!registration || registration.user_id !== userId) {
    throwApiError(ApiErrorCode.NOT_FOUND, "Trigger registration not found");
  }
  return registration;
}

export const jobsRouter = router({
  list: protectedProcedure
    .input(listInput)
    .output(listOutput)
    .query(async ({ ctx, input }) => {
      const [jobs, nextStartKey] = await Job.paginate(ctx.userId, {
        limit: input.limit,
        workflowId: input.workflow_id,
        startKey: input.start_key
      });
      return {
        jobs: jobs.map((j) => toJobResponse(j)),
        next_start_key: nextStartKey || null
      };
    }),

  get: protectedProcedure
    .input(getInput)
    .output(jobResponse)
    .query(async ({ ctx, input }) => {
      const job = (await Job.get(input.id)) as JobModel | null;
      if (!job || job.user_id !== ctx.userId) {
        throwApiError(ApiErrorCode.NOT_FOUND, "Job not found");
      }
      return toJobResponse(job);
    }),

  cancel: protectedProcedure
    .input(cancelInput)
    .output(cancelOutput)
    .mutation(async ({ ctx, input }) => {
      const job = (await Job.get(input.id)) as JobModel | null;
      if (!job || job.user_id !== ctx.userId) {
        throwApiError(ApiErrorCode.NOT_FOUND, "Job not found");
      }
      job.markCancelled();
      await job.save();
      return toBackgroundJobResponse(job);
    }),

  /**
   * Poll a suspended provider image Batch job. When the provider reports
   * completed, download the image(s), save assets, and mark the job completed.
   */
  checkBatch: protectedProcedure
    .input(checkBatchInput)
    .output(checkBatchOutput)
    .mutation(async ({ ctx, input }) => {
      const job = (await Job.get(input.id)) as JobModel | null;
      if (!job || job.user_id !== ctx.userId) {
        throwApiError(ApiErrorCode.NOT_FOUND, "Job not found");
      }

      if (job.status === "completed") {
        return {
          status: "completed" as const,
          provider_status: "completed",
          message: "Batch already completed.",
          job: toJobResponse(job),
          asset_ids:
            (job.metadata_json?.batch_asset_ids as string[] | undefined) ?? []
        };
      }

      const batchState = readImageBatchStateFromJob(job);
      if (!batchState) {
        return {
          status: "not_batch" as const,
          provider_status: null,
          message:
            job.status === "suspended"
              ? "This suspended job is not a provider image Batch."
              : "Job is not waiting on a provider Batch.",
          job: toJobResponse(job)
        };
      }

      // A live run still owns this Batch — leave it alone (the node is polling).
      if (job.status === "running" && jobRunRegistry.get(ctx.userId, job.id)) {
        return {
          status: "pending" as const,
          provider_status: "in_progress",
          message: "Batch is still generating in this app.",
          job: toJobResponse(job)
        };
      }

      if (job.status !== "suspended") {
        parkImageBatchJob(job, batchState);
        await job.save();
      }

      const providerId = batchState.provider;
      let provider: OpenAIProvider | GeminiProvider;
      if (providerId === "openai") {
        const key =
          (await getSecret("OPENAI_API_KEY", ctx.userId)) ||
          process.env.OPENAI_API_KEY ||
          "";
        if (!key) {
          throwApiError(
            ApiErrorCode.INVALID_INPUT,
            "OPENAI_API_KEY is not configured"
          );
        }
        provider = new OpenAIProvider({ OPENAI_API_KEY: key });
      } else {
        const key =
          (await getSecret("GEMINI_API_KEY", ctx.userId)) ||
          process.env.GEMINI_API_KEY ||
          "";
        if (!key) {
          throwApiError(
            ApiErrorCode.INVALID_INPUT,
            "GEMINI_API_KEY is not configured"
          );
        }
        provider = new GeminiProvider({ GEMINI_API_KEY: key });
      }

      const snapshot = await provider.getImageBatch({
        batchId: batchState.batchId
      });

      if (
        snapshot.status === "validating" ||
        snapshot.status === "in_progress" ||
        snapshot.status === "finalizing" ||
        snapshot.status === "cancelling" ||
        snapshot.status === "unknown"
      ) {
        job.suspension_reason = `${IMAGE_BATCH_SUSPEND_REASON} (status: ${snapshot.status})`;
        await job.save();
        return {
          status: "pending" as const,
          provider_status: snapshot.status,
          message: `Still generating (${snapshot.status}). Checking again soon.`,
          job: toJobResponse(job)
        };
      }

      if (
        snapshot.status === "failed" ||
        snapshot.status === "cancelled" ||
        snapshot.status === "expired"
      ) {
        const detail =
          snapshot.error?.trim() ||
          `Provider Batch ended with status=${snapshot.status}`;
        job.markFailed(detail);
        await job.save();
        return {
          status: snapshot.status as "failed" | "cancelled" | "expired",
          provider_status: snapshot.status,
          message: detail,
          job: toJobResponse(job)
        };
      }

      if (snapshot.status !== "completed") {
        return {
          status: "pending" as const,
          provider_status: snapshot.status,
          message: `Unexpected provider status '${snapshot.status}'. Try Check again later.`,
          job: toJobResponse(job)
        };
      }

      // Idempotent: if a previous Check already saved assets, don't re-download.
      const existingIds = job.metadata_json?.batch_asset_ids;
      if (Array.isArray(existingIds) && existingIds.length > 0) {
        job.markCompleted();
        await job.save();
        return {
          status: "completed" as const,
          provider_status: "completed",
          message: "Batch completed.",
          job: toJobResponse(job),
          asset_ids: existingIds.filter(
            (id): id is string => typeof id === "string"
          )
        };
      }

      const images = await provider.downloadImageBatchResults({
        batchId: batchState.batchId,
        model: batchState.model
      });
      if (images.length === 0) {
        job.markFailed("Image batch completed but returned no images");
        await job.save();
        return {
          status: "failed" as const,
          provider_status: "completed",
          message: "Image batch completed but returned no images",
          job: toJobResponse(job)
        };
      }

      const assetIds: string[] = [];
      const nodeId = batchState.nodeId ?? job.suspended_node_id;
      for (let i = 0; i < images.length; i++) {
        const bytes = images[i];
        if (!bytes || bytes.length === 0) continue;
        const asset = await createAssetModelInterface({
          userId: ctx.userId,
          workflowId: job.workflow_id,
          jobId: job.id,
          nodeId,
          name: `batch_${batchState.provider}_${i + 1}.png`,
          contentType: "image/png",
          content: bytes,
          metadata: { generation_index: i }
        });
        assetIds.push(asset.id);
      }

      job.metadata_json = {
        ...(job.metadata_json ?? {}),
        kind: IMAGE_BATCH_KIND,
        batch_asset_ids: assetIds,
        batch_id: batchState.batchId,
        batch_provider: batchState.provider
      };
      job.markCompleted();
      await job.save();

      return {
        status: "completed" as const,
        provider_status: "completed",
        message:
          assetIds.length === 1
            ? "Batch completed — image is on the workflow node."
            : `Batch completed — ${assetIds.length} images are on the workflow node.`,
        job: toJobResponse(job),
        asset_ids: assetIds
      };
    }),

  // ── triggersRunning (GET /api/jobs/triggers/running) ────────────────────
  // The caller's enabled trigger registrations — the set the host's ingestion
  // adapters (webhook route, scheduler, file watcher) are currently listening
  // for — plus the ones the dispatcher disarmed. A trigger that stopped on
  // its own is exactly what a workflow list has to surface, and dropping it
  // from this response made it vanish silently instead (PRD §8).
  // `enabled` distinguishes the two.
  triggersRunning: protectedProcedure.query(async ({ ctx }) => {
    const registrations = await TriggerRegistration.findByUser(ctx.userId);
    return {
      triggers: registrations
        .filter((r) => r.enabled === 1 || r.disabled_reason !== null)
        .map((r) => toTriggerRegistrationResponse(r))
    };
  }),

  // ── triggerStart (POST /api/jobs/triggers/:id/start) ────────────────────
  triggerStart: protectedProcedure
    .input(triggerIdInput)
    .mutation(async ({ ctx, input }) => {
      const registration = await requireOwnedRegistration(input.id, ctx.userId);
      const wasEnabled = registration.enabled === 1;
      // Re-arming is a fresh start: a registration the dispatcher gave up on
      // would otherwise disable itself again one failure later.
      rearmTrigger(registration);
      await registration.save();
      if (!wasEnabled) {
        await RunEvent.appendEvent(
          registration.workflow_id,
          "TriggerRegistered",
          {
            registration_id: registration.id,
            workflow_id: registration.workflow_id,
            kind: registration.kind
          },
          registration.node_id
        );
      }
      return toTriggerRegistrationResponse(registration);
    }),

  // ── triggerStop (POST /api/jobs/triggers/:id/stop) ──────────────────────
  triggerStop: protectedProcedure
    .input(triggerIdInput)
    .mutation(async ({ ctx, input }) => {
      const registration = await requireOwnedRegistration(input.id, ctx.userId);
      registration.enabled = 0;
      // A person switched it off; clear any dispatcher verdict so the UI does
      // not keep explaining a stop the user made themselves.
      registration.disabled_reason = null;
      await registration.save();
      return toTriggerRegistrationResponse(registration);
    })
});
