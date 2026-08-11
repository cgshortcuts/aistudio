export function applyStarredAssetFilter<T extends { id: string }>(
  assets: T[],
  starredFilter: boolean,
  starredIds: readonly string[]
): T[] {
  if (!starredFilter) {
    return assets;
  }
  const ids = new Set(starredIds);
  return assets.filter((asset) => ids.has(asset.id));
}
