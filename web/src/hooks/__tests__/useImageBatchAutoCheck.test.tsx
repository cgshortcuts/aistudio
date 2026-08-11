import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { Job } from "../../stores/ApiTypes";

jest.mock("../useRunningJobs", () => ({
  useRunningJobs: jest.fn()
}));

jest.mock("../../trpc/client", () => ({
  trpcClient: {
    jobs: {
      checkBatch: { mutate: jest.fn() }
    }
  }
}));

jest.mock("../../contexts/WorkflowManagerContext", () => ({
  useWorkflowManager: (
    selector: (s: {
      fetchWorkflow: jest.Mock;
      setCurrentWorkflowId: jest.Mock;
    }) => unknown
  ) =>
    selector({
      fetchWorkflow: jest.fn().mockResolvedValue({ id: "wf-1" }),
      setCurrentWorkflowId: jest.fn()
    })
}));

jest.mock("../../stores/WorkflowRunsStore", () => ({
  __esModule: true,
  default: {
    getState: () => ({ runs: {} })
  }
}));

jest.mock("../../stores/NotificationStore", () => ({
  useNotificationStore: (
    selector: (s: { addNotification: jest.Mock }) => unknown
  ) => selector({ addNotification: jest.fn() })
}));

jest.mock("../../stores/WorkflowAssetStore", () => ({
  useWorkflowAssetStore: {
    getState: () => ({ loadWorkflowAssets: jest.fn().mockResolvedValue([]) })
  }
}));

import { useImageBatchAutoCheck } from "../useImageBatchAutoCheck";
import { useRunningJobs } from "../useRunningJobs";
import { trpcClient } from "../../trpc/client";

const mockUseRunningJobs = useRunningJobs as unknown as jest.Mock;
const mockCheckBatch = trpcClient.jobs.checkBatch.mutate as jest.Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return (
    <MemoryRouter>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
};

const batchJob: Job = {
  id: "batch-1",
  user_id: "u",
  job_type: "workflow",
  workflow_id: "wf-1",
  status: "suspended",
  started_at: new Date().toISOString(),
  suspension_reason: "Provider Batch — checking until the image is ready.",
  suspension_metadata: {
    kind: "image_batch",
    provider: "gemini",
    batchId: "b1",
    model: "gemini-3.1-flash-image",
    nodeId: "node-1"
  }
} as Job;

describe("useImageBatchAutoCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckBatch.mockResolvedValue({
      status: "pending",
      provider_status: "in_progress",
      message: "still going",
      job: batchJob
    });
  });

  it("checks suspended Batch jobs on mount", async () => {
    mockUseRunningJobs.mockReturnValue({
      data: [batchJob],
      isLoading: false,
      error: null
    });

    renderHook(() => useImageBatchAutoCheck(), { wrapper });

    await waitFor(() => {
      expect(mockCheckBatch).toHaveBeenCalledWith({ id: "batch-1" });
    });
  });

  it("does not check ordinary running jobs", async () => {
    mockUseRunningJobs.mockReturnValue({
      data: [
        {
          id: "run-1",
          user_id: "u",
          job_type: "workflow",
          workflow_id: "wf-1",
          status: "running",
          started_at: new Date().toISOString()
        } as Job
      ],
      isLoading: false,
      error: null
    });

    renderHook(() => useImageBatchAutoCheck(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockCheckBatch).not.toHaveBeenCalled();
  });
});
