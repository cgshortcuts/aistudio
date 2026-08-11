import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import mockTheme from "../../../__mocks__/themeMock";

import { useWorkspaceTabsStore } from "../../../stores/WorkspaceTabsStore";

jest.mock("../../../hooks/useWorkflowDirty", () => ({
  useWorkflowDirty: () => false
}));
jest.mock("../../../hooks/useWorkflowRunnerState", () => ({
  useIsWorkflowRunning: () => false
}));
jest.mock("../../../stores/SettingsStore", () => ({
  useSettingsStore: (selector: (s: unknown) => unknown) =>
    selector({ settings: { instantUpdate: false } })
}));
jest.mock("../../../custom/workspace-tabs", () => ({
  useWorkspaceTabStrip: () => undefined
}));
jest.mock("../../panels/NotificationButton", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../OpenMenu", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../MobileDocumentSelector", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../../panels/MobileRailLauncher", () => ({
  __esModule: true,
  default: () => null
}));

const getWorkflow = jest.fn();
const updateWorkflow = jest.fn();
const saveWorkflow = jest.fn().mockResolvedValue(undefined);
const removeWorkflow = jest.fn();

jest.mock("../../../contexts/WorkflowManagerContext", () => ({
  useWorkflowManager: (selector: (s: unknown) => unknown) =>
    selector({
      getWorkflow,
      updateWorkflow,
      saveWorkflow,
      removeWorkflow
    }),
  useWorkflowManagerStore: () => ({
    getState: () => ({
      openWorkflows: [],
      reorderWorkflows: jest.fn()
    })
  })
}));

import WorkspaceTabBar from "../WorkspaceTabBar";

const renderBar = () =>
  render(
    <ThemeProvider theme={mockTheme}>
      <WorkspaceTabBar />
    </ThemeProvider>
  );

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  saveWorkflow.mockResolvedValue(undefined);
  useWorkspaceTabsStore.setState({
    tabs: [
      {
        id: "workflow:a",
        type: "workflow",
        ref: "a",
        mode: "edit",
        title: "Alpha"
      }
    ],
    activeTabId: "workflow:a"
  });
  getWorkflow.mockReturnValue({
    id: "a",
    name: "Alpha",
    access: "private",
    graph: { nodes: [], edges: [] }
  });
});

describe("WorkspaceTabBar", () => {
  it("renames a workflow when the tab name is edited", async () => {
    renderBar();

    fireEvent.click(screen.getByText("Alpha"));
    const input = screen.getByRole("textbox", { name: "Tab name" });
    fireEvent.change(input, { target: { value: "Beta" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(updateWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({ id: "a", name: "Beta" })
      );
    });
    expect(saveWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a", name: "Beta" })
    );
    expect(useWorkspaceTabsStore.getState().tabs[0].title).toBe("Beta");
  });
});
