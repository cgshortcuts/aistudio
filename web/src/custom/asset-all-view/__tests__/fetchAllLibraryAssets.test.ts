import { fetchAllLibraryAssets, type ListAllAssetsFn } from "../fetchAllLibraryAssets";
import type { Asset } from "../../../stores/ApiTypes";

describe("fetchAllLibraryAssets", () => {
  it("lists every asset via assets.list({ all: true })", async () => {
    const assets = [
      { id: "a1", content_type: "audio/wav", workflow_id: "wf-1" },
      { id: "a2", content_type: "image/png", parent_id: "folder-1" },
      { id: "a3", content_type: "folder" }
    ] as unknown as Asset[];
    const listAll: ListAllAssetsFn = jest.fn().mockResolvedValue({
      assets,
      next: null
    });

    const result = await fetchAllLibraryAssets(listAll);

    expect(listAll).toHaveBeenCalledWith({
      all: true,
      page_size: 10000
    });
    expect(result.assets).toEqual(assets);
    expect(result.next).toBeNull();
  });
});
