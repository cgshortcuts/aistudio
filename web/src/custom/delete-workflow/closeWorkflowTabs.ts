import {
  tabId,
  useWorkspaceTabsStore
} from "../../stores/WorkspaceTabsStore";

export function closeWorkflowTabs(workflowIds: string[]): void {
  const { closeTab } = useWorkspaceTabsStore.getState();
  for (const id of workflowIds) {
    closeTab(tabId("workflow", id));
  }
}
