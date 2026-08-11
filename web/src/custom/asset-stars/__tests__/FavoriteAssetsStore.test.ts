import { describe, it, expect, beforeEach } from "@jest/globals";
import { act } from "@testing-library/react";
import {
  forgetStarredAssets,
  useFavoriteAssetsStore
} from "../FavoriteAssetsStore";

describe("FavoriteAssetsStore", () => {
  beforeEach(() => {
    act(() => {
      useFavoriteAssetsStore.setState({
        favoriteAssetIds: [],
        starredFilter: false
      });
    });
    localStorage.removeItem("favorite-assets");
  });

  describe("toggleFavorite", () => {
    it("adds an asset when it is not starred", () => {
      act(() => {
        useFavoriteAssetsStore.getState().toggleFavorite("asset-1");
      });

      const ids = useFavoriteAssetsStore.getState().favoriteAssetIds;
      expect(ids).toEqual(["asset-1"]);
    });

    it("removes an asset when it is already starred", () => {
      act(() => {
        useFavoriteAssetsStore.setState({
          favoriteAssetIds: ["asset-1", "asset-2"]
        });
      });

      act(() => {
        useFavoriteAssetsStore.getState().toggleFavorite("asset-1");
      });

      expect(useFavoriteAssetsStore.getState().favoriteAssetIds).toEqual([
        "asset-2"
      ]);
    });
  });

  describe("addFavorite", () => {
    it("does not add a duplicate id", () => {
      act(() => {
        useFavoriteAssetsStore.getState().addFavorite("asset-1");
        useFavoriteAssetsStore.getState().addFavorite("asset-1");
      });

      expect(useFavoriteAssetsStore.getState().favoriteAssetIds).toEqual([
        "asset-1"
      ]);
    });
  });

  describe("starredFilter", () => {
    it("toggles the starred-only filter", () => {
      act(() => {
        useFavoriteAssetsStore.getState().toggleStarredFilter();
      });

      expect(useFavoriteAssetsStore.getState().starredFilter).toBe(true);

      act(() => {
        useFavoriteAssetsStore.getState().toggleStarredFilter();
      });

      expect(useFavoriteAssetsStore.getState().starredFilter).toBe(false);
    });
  });

  describe("forgetStarredAssets", () => {
    it("drops deleted ids from the starred list", () => {
      act(() => {
        useFavoriteAssetsStore.setState({
          favoriteAssetIds: ["keep", "gone-a", "gone-b"]
        });
      });

      act(() => {
        forgetStarredAssets(["gone-a", "gone-b"]);
      });

      expect(useFavoriteAssetsStore.getState().favoriteAssetIds).toEqual([
        "keep"
      ]);
    });
  });
});
