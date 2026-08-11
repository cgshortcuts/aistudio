import { tabId, useWorkspaceTabsStore } from "../../../stores/WorkspaceTabsStore";
import { closeWorkflowTabs } from "../closeWorkflowTabs";

beforeEach(() => {
  localStorage.clear();
  useWorkspaceTabsStore.setState({
    tabs: [
      {
        id: tabId("workflow", "a"),
        type: "workflow",
        ref: "a",
        mode: "edit",
        title: "Alpha"
      },
      {
        id: tabId("chat", "t1"),
        type: "chat",
        ref: "t1",
        mode: "view",
        title: "Chat"
      }
    ],
    activeTabId: tabId("workflow", "a")
  });
});

describe("closeWorkflowTabs", () => {
  it("closes matching workflow tabs and leaves other tabs", () => {
    closeWorkflowTabs(["a"]);

    const { tabs, activeTabId } = useWorkspaceTabsStore.getState();
    expect(tabs.map((tab) => tab.id)).toEqual([tabId("chat", "t1")]);
    expect(activeTabId).toBe(tabId("chat", "t1"));
  });
});
