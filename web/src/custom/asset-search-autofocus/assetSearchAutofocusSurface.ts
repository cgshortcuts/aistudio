export type AssetSearchFocusSurface = "library" | "assets-page";

export function assetSearchAutofocusSurface(options: {
  forceGlobalAssets: boolean;
  isFullscreenAssets: boolean;
}): AssetSearchFocusSurface | undefined {
  if (options.forceGlobalAssets) {
    return "library";
  }
  if (options.isFullscreenAssets) {
    return "assets-page";
  }
  return undefined;
}
