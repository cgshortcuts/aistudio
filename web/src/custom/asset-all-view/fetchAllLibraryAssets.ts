import type { Asset, AssetList } from "../../stores/ApiTypes";

export interface AssetListPage {
  assets: Asset[];
  next?: string | null;
}

export type ListAllAssetsFn = (args: {
  all: true;
  page_size: number;
}) => Promise<AssetListPage>;

const PAGE_SIZE = 10000;

/**
 * Load every asset for the user — folder tree and workflow outputs (including
 * `parent_id: null` autosaves). Uses `assets.list({ all: true })`, the same
 * unscoped listing path as a workflow filter (not folder-recursive / name search).
 */
export async function fetchAllLibraryAssets(
  listAll: ListAllAssetsFn
): Promise<AssetList> {
  const result = await listAll({
    all: true,
    page_size: PAGE_SIZE
  });
  return { next: result.next ?? null, assets: result.assets };
}
