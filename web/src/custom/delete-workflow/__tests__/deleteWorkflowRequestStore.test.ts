import {
  requestDeleteWorkflow,
  useDeleteWorkflowRequestStore
} from "../deleteWorkflowRequestStore";

beforeEach(() => {
  useDeleteWorkflowRequestStore.setState({ workflowsToDelete: [] });
});

describe("deleteWorkflowRequestStore", () => {
  it("queues a workflow for delete confirmation", () => {
    requestDeleteWorkflow({ id: "a", name: "Alpha" });

    expect(useDeleteWorkflowRequestStore.getState().workflowsToDelete).toEqual([
      { id: "a", name: "Alpha" }
    ]);
  });

  it("clears the queued workflow", () => {
    requestDeleteWorkflow({ id: "a", name: "Alpha" });
    useDeleteWorkflowRequestStore.getState().close();

    expect(
      useDeleteWorkflowRequestStore.getState().workflowsToDelete
    ).toEqual([]);
  });
});
