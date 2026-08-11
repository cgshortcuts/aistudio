import { create } from "zustand";

export interface WorkflowDeleteTarget {
  id: string;
  name: string;
}

interface DeleteWorkflowRequestState {
  workflowsToDelete: WorkflowDeleteTarget[];
  requestDelete: (workflows: WorkflowDeleteTarget[]) => void;
  close: () => void;
}

export const useDeleteWorkflowRequestStore = create<DeleteWorkflowRequestState>(
  (set) => ({
    workflowsToDelete: [],
    requestDelete: (workflows) => set({ workflowsToDelete: workflows }),
    close: () => set({ workflowsToDelete: [] })
  })
);

export function requestDeleteWorkflow(workflow: WorkflowDeleteTarget): void {
  useDeleteWorkflowRequestStore.getState().requestDelete([workflow]);
}
