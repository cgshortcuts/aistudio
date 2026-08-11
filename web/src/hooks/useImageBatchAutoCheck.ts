/**
 * Poll suspended (and orphaned running) provider image-Batch jobs until they
 * complete. Fast interval for the first 5 minutes, then slower. Runs on app
 * open and keeps going in the background.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import { trpcClient } from "../trpc/client";
import { useRunningJobs } from "./useRunningJobs";
import { useWorkflowManager } from "../contexts/WorkflowManagerContext";
import useWorkflowRunsStore from "../stores/WorkflowRunsStore";
import { useNotificationStore } from "../stores/NotificationStore";
import {
  applyImageBatchComplete,
  imageBatchPollIntervalMs,
  isImageBatchJob,
  openWorkflowForBatchResult
} from "../utils/imageBatch";
import type { Job } from "../stores/ApiTypes";

const isLocallyExecuting = (job: Job): boolean => {
  const run = useWorkflowRunsStore.getState().runs[job.workflow_id]?.[job.id];
  return run?.state === "running";
};

export function useImageBatchAutoCheck(): void {
  const { data: jobs } = useRunningJobs();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const { fetchWorkflow, setCurrentWorkflowId } = useWorkflowManager(
    useShallow((s) => ({
      fetchWorkflow: s.fetchWorkflow,
      setCurrentWorkflowId: s.setCurrentWorkflowId
    }))
  );
  const inFlight = useRef(new Set<string>());

  const batchJobs = useMemo(() => {
    const list = jobs ?? [];
    return list.filter((job) => {
      if (!isImageBatchJob(job)) {
        return false;
      }
      if (job.status === "suspended") {
        return true;
      }
      if (job.status === "running" && !isLocallyExecuting(job)) {
        return true;
      }
      return false;
    });
  }, [jobs]);

  const batchIdsKey = batchJobs.map((j) => j.id).sort().join(",");

  const checkOne = useCallback(
    async (job: Job) => {
      if (inFlight.current.has(job.id)) {
        return;
      }
      inFlight.current.add(job.id);
      try {
        const result = await trpcClient.jobs.checkBatch.mutate({ id: job.id });
        if (result.status === "completed") {
          const nodeId =
            result.job.suspended_node_id ??
            (typeof result.job.suspension_metadata?.nodeId === "string"
              ? result.job.suspension_metadata.nodeId
              : null);
          await applyImageBatchComplete({
            queryClient,
            workflowId: result.job.workflow_id,
            jobId: job.id,
            nodeId,
            assetIds: result.asset_ids ?? []
          });
          if (result.job.workflow_id) {
            await fetchWorkflow(result.job.workflow_id);
            setCurrentWorkflowId(result.job.workflow_id);
            openWorkflowForBatchResult(result.job.workflow_id);
            navigate("/workspace");
          }
          addNotification({
            type: "success",
            alert: true,
            content: result.message
          });
        } else if (
          result.status === "failed" ||
          result.status === "cancelled" ||
          result.status === "expired"
        ) {
          queryClient.invalidateQueries({ queryKey: ["jobs"] });
          addNotification({
            type: "warning",
            alert: true,
            content: result.message
          });
        }
      } catch {
        // Next interval retries. Don't toast every failed poll.
      } finally {
        inFlight.current.delete(job.id);
      }
    },
    [
      addNotification,
      fetchWorkflow,
      navigate,
      queryClient,
      setCurrentWorkflowId
    ]
  );

  const tick = useCallback(() => {
    for (const job of batchJobs) {
      void checkOne(job);
    }
  }, [batchJobs, checkOne]);

  useEffect(() => {
    if (!batchIdsKey) {
      return;
    }
    tick();
  }, [batchIdsKey, tick]);

  useEffect(() => {
    if (batchJobs.length === 0) {
      return;
    }
    const ms = imageBatchPollIntervalMs(batchJobs);
    const id = window.setInterval(tick, ms);
    return () => window.clearInterval(id);
  }, [batchIdsKey, batchJobs, tick]);
}
