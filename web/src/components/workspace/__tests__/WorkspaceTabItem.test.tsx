import React from "react";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import mockTheme from "../../../__mocks__/themeMock";

import type { WorkspaceTab } from "../../../stores/WorkspaceTabsStore";

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
jest.mock("../../../custom/delete-workflow", () => ({
  requestDeleteWorkflow: jest.fn()
}));

import { requestDeleteWorkflow } from "../../../custom/delete-workflow";
import WorkspaceTabItem from "../WorkspaceTabItem";

const TAB: WorkspaceTab = {
  id: "workflow:a",
  type: "workflow",
  ref: "a",
  mode: "edit",
  title: "Alpha"
};

const renderTab = (
  overrides: Partial<React.ComponentProps<typeof WorkspaceTabItem>> = {}
) => {
  const props = {
    tab: TAB,
    isActive: true,
    isEditing: false,
    canRename: true,
    dropPosition: null,
    typeColor: "#fff",
    typeGlyph: "⬡",
    onActivate: jest.fn(),
    onBeginRename: jest.fn(),
    onClose: jest.fn(),
    onCloseOthers: jest.fn(),
    onCloseAll: jest.fn(),
    onDragStart: jest.fn(),
    onDragOver: jest.fn(),
    onDragLeave: jest.fn(),
    onDrop: jest.fn(),
    onCommitRename: jest.fn(),
    onCancelRename: jest.fn(),
    ...overrides
  };
  render(
    <ThemeProvider theme={mockTheme}>
      <WorkspaceTabItem {...props} />
    </ThemeProvider>
  );
  return props;
};

describe("WorkspaceTabItem", () => {
  beforeEach(() => {
    jest.mocked(requestDeleteWorkflow).mockClear();
  });

  it("closes the tab on middle click", () => {
    const props = renderTab();
    const tab = screen.getByRole("tab", { name: /Alpha/ });

    fireEvent.mouseDown(tab, { button: 1 });
    fireEvent(
      tab,
      new MouseEvent("auxclick", { button: 1, bubbles: true, cancelable: true })
    );

    expect(props.onClose).toHaveBeenCalledWith(TAB);
  });

  it("cancels middle-click mousedown so the strip does not autoscroll", () => {
    renderTab();
    const tab = screen.getByRole("tab", { name: /Alpha/ });

    const event = createEvent.mouseDown(tab, { button: 1 });
    fireEvent(tab, event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("starts rename when the active tab name is clicked", () => {
    const props = renderTab({ isActive: true });

    fireEvent.click(screen.getByText("Alpha"));

    expect(props.onBeginRename).toHaveBeenCalledWith(TAB);
  });

  it("does not start rename when an inactive tab name is clicked", () => {
    const props = renderTab({ isActive: false });

    fireEvent.click(screen.getByText("Alpha"));

    expect(props.onBeginRename).not.toHaveBeenCalled();
    expect(props.onActivate).toHaveBeenCalledWith(TAB.id);
  });

  it("starts rename on double-click", () => {
    const props = renderTab();
    const tab = screen.getByRole("tab", { name: /Alpha/ });

    fireEvent.doubleClick(tab);

    expect(props.onBeginRename).toHaveBeenCalledWith(TAB);
  });

  it("does not cancel left-click on the rename field so it can take focus", () => {
    renderTab({ isEditing: true });
    const input = screen.getByRole("textbox", { name: "Tab name" });

    const event = createEvent.mouseDown(input, { button: 0 });
    fireEvent(input, event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("commits the typed name on Enter", () => {
    const props = renderTab({ isEditing: true });
    const input = screen.getByRole("textbox", { name: "Tab name" });

    fireEvent.change(input, { target: { value: "Beta" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(props.onCommitRename).toHaveBeenCalledWith(TAB, "Beta");
  });

  it("offers Delete Workflow on a workflow tab", () => {
    const props = renderTab();
    const tab = screen.getByRole("tab", { name: /Alpha/ });

    fireEvent.contextMenu(tab);

    fireEvent.click(screen.getByText("Delete Workflow"));

    expect(requestDeleteWorkflow).toHaveBeenCalledWith({
      id: "a",
      name: "Alpha"
    });
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("does not offer Delete Workflow on a non-workflow tab", () => {
    renderTab({
      tab: {
        id: "chat:t1",
        type: "chat",
        ref: "t1",
        mode: "view",
        title: "Chat"
      }
    });
    const tab = screen.getByRole("tab", { name: /Chat/ });

    fireEvent.contextMenu(tab);

    expect(screen.getByText("Close Tab")).toBeInTheDocument();
    expect(screen.queryByText("Delete Workflow")).not.toBeInTheDocument();
  });

  it("does not cancel Space in the rename field", () => {
    renderTab({ isEditing: true });
    const input = screen.getByRole("textbox", { name: "Tab name" });

    const event = createEvent.keyDown(input, { key: " " });
    fireEvent(input, event);

    expect(event.defaultPrevented).toBe(false);
  });
});
