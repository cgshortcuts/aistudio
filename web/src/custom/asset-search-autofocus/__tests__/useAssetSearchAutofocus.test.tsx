import { act, renderHook } from "@testing-library/react";

import { tabId, useWorkspaceTabsStore } from "../../../stores/WorkspaceTabsStore";
import {
  requestAssetSearchFocus,
  resetAssetSearchAutofocusStore
} from "../AssetSearchAutofocusStore";
import { useAssetSearchAutofocus } from "../useAssetSearchAutofocus";

jest.mock("../../../hooks/useAutoFocusEnabled", () => ({
  useAutoFocusEnabled: () => true
}));

const ASSETS_PAGE_TAB_ID = tabId("page", "assets");

describe("useAssetSearchAutofocus", () => {
  beforeEach(() => {
    resetAssetSearchAutofocusStore();
    useWorkspaceTabsStore.setState({ tabs: [], activeTabId: null });
  });

  it("starts expanded for library and does not focus until requested", () => {
    const { result } = renderHook(() => useAssetSearchAutofocus("library"));

    expect(result.current.expanded).toBe(true);
    expect(result.current.focusSearchInput).toBe(false);
    expect(result.current.focusNonce).toBe(0);
  });

  it("starts collapsed when no autofocus surface is set", () => {
    const { result } = renderHook(() => useAssetSearchAutofocus(undefined));

    expect(result.current.expanded).toBe(false);
    expect(result.current.focusSearchInput).toBe(false);
  });

  it("expands and focuses when library focus is requested", () => {
    const { result } = renderHook(() => useAssetSearchAutofocus("library"));

    act(() => {
      result.current.setExpanded(false);
    });
    expect(result.current.expanded).toBe(false);

    act(() => {
      requestAssetSearchFocus("library");
    });

    expect(result.current.expanded).toBe(true);
    expect(result.current.focusSearchInput).toBe(true);
    expect(result.current.focusNonce).toBe(1);
  });

  it("ignores a focus request for a different surface", () => {
    const { result } = renderHook(() => useAssetSearchAutofocus("library"));

    act(() => {
      requestAssetSearchFocus("assets-page");
    });

    expect(result.current.focusSearchInput).toBe(false);
    expect(result.current.focusNonce).toBe(0);
  });

  it("does not focus the assets page on first mount when that tab is already active", () => {
    useWorkspaceTabsStore.setState({
      tabs: [
        {
          id: ASSETS_PAGE_TAB_ID,
          type: "page",
          ref: "assets",
          mode: "view",
          title: "Assets"
        }
      ],
      activeTabId: ASSETS_PAGE_TAB_ID
    });

    const { result } = renderHook(() => useAssetSearchAutofocus("assets-page"));

    expect(result.current.focusNonce).toBe(0);
    expect(result.current.focusSearchInput).toBe(false);
  });

  it("focuses when the assets page tab becomes active after another tab", () => {
    useWorkspaceTabsStore.setState({
      tabs: [
        {
          id: tabId("page", "settings"),
          type: "page",
          ref: "settings",
          mode: "view",
          title: "Settings"
        }
      ],
      activeTabId: tabId("page", "settings")
    });

    const { result } = renderHook(() => useAssetSearchAutofocus("assets-page"));
    expect(result.current.focusNonce).toBe(0);

    act(() => {
      useWorkspaceTabsStore.getState().setActiveTab(ASSETS_PAGE_TAB_ID);
    });

    expect(result.current.expanded).toBe(true);
    expect(result.current.focusSearchInput).toBe(true);
    expect(result.current.focusNonce).toBe(1);
  });
});
