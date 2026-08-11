import { requestAssetSearchFocus } from "./AssetSearchAutofocusStore";
import { willOpenLeftPanelView } from "./willOpenLeftPanelView";

export function notifyLibrarySearchIfOpening(
  panel: { activeView: string; isVisible: boolean },
  view: string
): void {
  if (view === "library" && willOpenLeftPanelView(panel, view)) {
    requestAssetSearchFocus("library");
  }
}

export function notifyAssetsPageSearch(): void {
  requestAssetSearchFocus("assets-page");
}
