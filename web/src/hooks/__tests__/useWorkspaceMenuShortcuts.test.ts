import { renderHook, act } from "@testing-library/react";
import { useWorkspaceMenuShortcuts } from "../useWorkspaceMenuShortcuts";
import { useWorkspaceTabsStore } from "../../stores/WorkspaceTabsStore";
import { registerComboCallback } from "../../stores/KeyPressedStore";

const mockRemoveWorkflow = jest.fn();
let menuHandler: ((data: { type: string; index?: number }) => void) | null =
  null;

jest.mock("../useIpcRenderer", () => ({
  useMenuHandler: (handler: (data: { type: string; index?: number }) => void) => {
    menuHandler = handler;
  }
}));

jest.mock("../../contexts/WorkflowManagerContext", () => ({
  useWorkflowManager: (
    selector: (state: { removeWorkflow: () => void }) => unknown
  ) => selector({ removeWorkflow: mockRemoveWorkflow })
}));

jest.mock("../../stores/KeyPressedStore", () => ({
  registerComboCallback: jest.fn(() => jest.fn())
}));

jest.mock("../../utils/platform", () => ({
  isMac: () => false
}));

describe("useWorkspaceMenuShortcuts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    menuHandler = null;
    useWorkspaceTabsStore.setState({
      tabs: [
        {
          id: "workflow:a",
          type: "workflow",
          ref: "a",
          mode: "edit",
          title: "A"
        },
        {
          id: "workflow:b",
          type: "workflow",
          ref: "b",
          mode: "edit",
          title: "B"
        }
      ],
      activeTabId: "workflow:a"
    });
  });

  it("registers prev/next tab keyboard combos", () => {
    renderHook(() => useWorkspaceMenuShortcuts());

    const combos = (registerComboCallback as jest.Mock).mock.calls.map(
      ([combo]: [string]) => combo
    );
    expect(combos).toEqual(
      expect.arrayContaining([
        "pageup",
        "pagedown",
        "control+pageup",
        "control+pagedown",
        "1+control"
      ])
    );
  });

  it("switches tabs via setActiveTab without navigation", () => {
    renderHook(() => useWorkspaceMenuShortcuts());

    act(() => {
      menuHandler?.({ type: "nextTab" });
    });

    expect(useWorkspaceTabsStore.getState().activeTabId).toBe("workflow:b");

    act(() => {
      menuHandler?.({ type: "prevTab" });
    });

    expect(useWorkspaceTabsStore.getState().activeTabId).toBe("workflow:a");
  });

  it("switches to a tab by index", () => {
    renderHook(() => useWorkspaceMenuShortcuts());

    act(() => {
      menuHandler?.({ type: "switchToTab", index: 1 });
    });

    expect(useWorkspaceTabsStore.getState().activeTabId).toBe("workflow:b");
  });
});
