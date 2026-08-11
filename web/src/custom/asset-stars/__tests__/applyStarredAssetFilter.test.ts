import { applyStarredAssetFilter } from "../applyStarredAssetFilter";
import { toggleAssetInSelection } from "../toggleAssetInSelection";

describe("applyStarredAssetFilter", () => {
  const assets = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("returns every asset when the filter is off", () => {
    expect(applyStarredAssetFilter(assets, false, ["a"])).toEqual(assets);
  });

  it("keeps only starred assets when the filter is on", () => {
    expect(applyStarredAssetFilter(assets, true, ["b", "c"])).toEqual([
      { id: "b" },
      { id: "c" }
    ]);
  });

  it("returns an empty list when nothing is starred", () => {
    expect(applyStarredAssetFilter(assets, true, [])).toEqual([]);
  });
});

describe("toggleAssetInSelection", () => {
  it("adds an unselected id", () => {
    expect(toggleAssetInSelection(["a"], "b")).toEqual(["a", "b"]);
  });

  it("removes a selected id", () => {
    expect(toggleAssetInSelection(["a", "b"], "a")).toEqual(["b"]);
  });
});
