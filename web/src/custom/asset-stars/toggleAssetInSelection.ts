export function toggleAssetInSelection(
  selectedAssetIds: readonly string[],
  assetId: string
): string[] {
  return selectedAssetIds.includes(assetId)
    ? selectedAssetIds.filter((id) => id !== assetId)
    : [...selectedAssetIds, assetId];
}
