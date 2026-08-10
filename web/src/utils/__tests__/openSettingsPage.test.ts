/**
 * @jest-environment node
 */
import { openSettingsPage } from "../openSettingsPage";
import { useWorkspaceTabsStore } from "../../stores/WorkspaceTabsStore";
import { tabId } from "../../stores/WorkspaceTabsStore";

describe("openSettingsPage", () => {
  const navigate = jest.fn();

  beforeEach(() => {
    navigate.mockClear();
    useWorkspaceTabsStore.setState({ tabs: [], activeTabId: null });
  });

  it("opens a settings page tab and navigates to /workspace", () => {
    openSettingsPage({ navigate });
    const expectedId = tabId("page", "settings");
    const { tabs, activeTabId } = useWorkspaceTabsStore.getState();
    expect(tabs).toEqual([
      expect.objectContaining({
        id: expectedId,
        type: "page",
        ref: "settings",
        title: "Settings"
      })
    ]);
    expect(activeTabId).toBe(expectedId);
    expect(navigate).toHaveBeenCalledWith("/workspace");
  });

  it("passes tab and q on the workspace URL", () => {
    openSettingsPage({ tab: 1, q: "BYTEPLUS_API_KEY", navigate });
    expect(navigate).toHaveBeenCalledWith(
      "/workspace?tab=1&q=BYTEPLUS_API_KEY"
    );
  });
});
