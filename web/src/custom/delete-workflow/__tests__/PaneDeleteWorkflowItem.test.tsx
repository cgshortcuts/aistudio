import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import mockTheme from "../../../__mocks__/themeMock";
import { useDeleteWorkflowRequestStore } from "../deleteWorkflowRequestStore";

const mockWorkflow = { id: "wf-1", name: "Mine" };
let openWorkflows: Array<{ id: string }> = [{ id: "wf-1" }];

jest.mock("../../../contexts/NodeContext", () => ({
  useNodes: (selector: (state: { workflow: typeof mockWorkflow }) => unknown) =>
    selector({ workflow: mockWorkflow })
}));

jest.mock("../../../contexts/WorkflowManagerContext", () => ({
  useWorkflowManager: (
    selector: (state: { openWorkflows: Array<{ id: string }> }) => unknown
  ) => selector({ openWorkflows })
}));

import { PaneDeleteWorkflowItem } from "../PaneDeleteWorkflowItem";

const renderItem = () =>
  render(
    <ThemeProvider theme={mockTheme}>
      <PaneDeleteWorkflowItem onClose={jest.fn()} />
    </ThemeProvider>
  );

describe("PaneDeleteWorkflowItem", () => {
  beforeEach(() => {
    openWorkflows = [{ id: "wf-1" }];
    useDeleteWorkflowRequestStore.setState({ workflowsToDelete: [] });
  });

  it("queues the host workflow for delete", () => {
    const onClose = jest.fn();
    render(
      <ThemeProvider theme={mockTheme}>
        <PaneDeleteWorkflowItem onClose={onClose} />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText("Delete Workflow"));

    expect(onClose).toHaveBeenCalled();
    expect(useDeleteWorkflowRequestStore.getState().workflowsToDelete).toEqual([
      { id: "wf-1", name: "Mine" }
    ]);
  });

  it("hides on a subgraph canvas", () => {
    openWorkflows = [{ id: "other-host" }];
    renderItem();

    expect(screen.queryByText("Delete Workflow")).not.toBeInTheDocument();
  });
});
