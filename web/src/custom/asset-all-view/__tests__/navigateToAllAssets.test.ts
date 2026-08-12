import { createStore } from "zustand";
import {
  navigateToAllAssets,
  ALL_ASSETS_SELECTION_ID
} from "../navigateToAllAssets";
import type { AssetGridStoreApi } from "../../../stores/AssetGridStore";

function makeGridStore(
  initial: Record<string, unknown> = {}
): AssetGridStoreApi {
  return createStore(() => ({
    allAssetsView: false,
    workflowFilter: "wf-1",
    currentFolderId: "folder-1",
    currentFolder: { id: "folder-1" },
    parentFolder: { id: "parent" },
    selectedFolderId: "folder-1",
    selectedFolderIds: ["folder-1"],
    selectedAssetIds: ["a1"],
    selectedAssets: [{ id: "a1" }],
    isGlobalSearchActive: true,
    isGlobalSearchMode: true,
    globalSearchResults: [{ id: "a1" }],
    globalSearchQuery: "cat",
    ...initial
  })) as unknown as AssetGridStoreApi;
}

describe("navigateToAllAssets", () => {
  it("enters All view and clears folder, workflow, and search scope", () => {
    const store = makeGridStore();

    navigateToAllAssets(store, { homeFolderId: "user-1" });

    const state = store.getState();
    expect(state.allAssetsView).toBe(true);
    expect(state.workflowFilter).toBeNull();
    expect(state.currentFolderId).toBe("user-1");
    expect(state.currentFolder).toBeNull();
    expect(state.parentFolder).toBeNull();
    expect(state.selectedFolderId).toBe(ALL_ASSETS_SELECTION_ID);
    expect(state.selectedFolderIds).toEqual([]);
    expect(state.selectedAssetIds).toEqual([]);
    expect(state.selectedAssets).toEqual([]);
    expect(state.isGlobalSearchActive).toBe(false);
    expect(state.isGlobalSearchMode).toBe(false);
    expect(state.globalSearchResults).toEqual([]);
    expect(state.globalSearchQuery).toBe("");
  });

  it("keeps the current folder as upload target when home is omitted", () => {
    const store = makeGridStore({ currentFolderId: "folder-keep" });

    navigateToAllAssets(store);

    expect(store.getState().currentFolderId).toBe("folder-keep");
    expect(store.getState().allAssetsView).toBe(true);
  });
});
