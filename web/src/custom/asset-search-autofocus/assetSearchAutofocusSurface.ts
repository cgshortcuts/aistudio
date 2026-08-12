export type AssetSearchFocusSurface = "library";

export function assetSearchAutofocusSurface(options: {
  forceGlobalAssets: boolean;
}): AssetSearchFocusSurface | undefined {
  if (options.forceGlobalAssets) {
    return "library";
  }
  return undefined;
}
