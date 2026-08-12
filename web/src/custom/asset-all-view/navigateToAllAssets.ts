import type { AssetGridStoreApi } from "../../stores/AssetGridStore";

/** Sentinel `selectedFolderId` so AssetGrid does not auto-navigate to Home. */
export const ALL_ASSETS_SELECTION_ID = "__all__";

export interface NavigateToAllAssetsOptions {
  /** Home folder id (usually the user id). Used as the upload/create target. */
  homeFolderId?: string | null;
}

/**
 * Enter the library-wide "All" assets view: clear workflow/folder highlight and
 * set `allAssetsView`. Uploads/creates use `homeFolderId` (or the existing
 * current folder) so they still land somewhere concrete.
 *
 * Keep `selectedFolderId` non-null (`ALL_ASSETS_SELECTION_ID`). AssetGrid
 * calls `navigateToFolderId(user.id)` whenever `selectedFolderId === null`,
 * which would clear `allAssetsView` on the next render.
 */
export function navigateToAllAssets(
  gridStore: AssetGridStoreApi,
  options: NavigateToAllAssetsOptions = {}
): void {
  const { homeFolderId } = options;
  const currentFolderId = gridStore.getState().currentFolderId;

  gridStore.setState({
    allAssetsView: true,
    workflowFilter: null,
    currentFolderId: homeFolderId ?? currentFolderId,
    currentFolder: null,
    parentFolder: null,
    selectedFolderId: ALL_ASSETS_SELECTION_ID,
    selectedFolderIds: [],
    selectedAssetIds: [],
    selectedAssets: [],
    isGlobalSearchActive: false,
    isGlobalSearchMode: false,
    globalSearchResults: [],
    globalSearchQuery: ""
  });
}
