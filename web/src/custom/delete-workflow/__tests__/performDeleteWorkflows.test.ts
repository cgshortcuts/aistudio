import { tabId, useWorkspaceTabsStore } from "../../../stores/WorkspaceTabsStore";
import { performDeleteWorkflows } from "../performDeleteWorkflows";

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
      }
    ],
    activeTabId: tabId("workflow", "a")
  });
});

describe("performDeleteWorkflows", () => {
  it("deletes, unloads, and closes the tab", async () => {
    const deleteWorkflow = jest.fn().mockResolvedValue(undefined);
    const removeWorkflow = jest.fn();

    await performDeleteWorkflows([{ id: "a", name: "Alpha" }], {
      deleteWorkflow,
      removeWorkflow
    });

    expect(deleteWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a", name: "Alpha" })
    );
    expect(removeWorkflow).toHaveBeenCalledWith("a");
    expect(useWorkspaceTabsStore.getState().tabs).toHaveLength(0);
  });

  it("does not close the tab when delete fails", async () => {
    const deleteWorkflow = jest
      .fn()
      .mockRejectedValue(new Error("Failed to delete workflow"));
    const removeWorkflow = jest.fn();

    await expect(
      performDeleteWorkflows([{ id: "a", name: "Alpha" }], {
        deleteWorkflow,
        removeWorkflow
      })
    ).rejects.toThrow("Failed to delete workflow");

    expect(removeWorkflow).not.toHaveBeenCalled();
    expect(useWorkspaceTabsStore.getState().tabs).toHaveLength(1);
  });
});
