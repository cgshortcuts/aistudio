import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

interface FavoriteAssetsState {
  favoriteAssetIds: string[];
  starredFilter: boolean;
  toggleFavorite: (assetId: string) => void;
  addFavorite: (assetId: string) => void;
  removeFavorite: (assetId: string) => void;
  isFavorite: (assetId: string) => boolean;
  setStarredFilter: (on: boolean) => void;
  toggleStarredFilter: () => void;
  clearAll: () => void;
}

export const useFavoriteAssetsStore = create<FavoriteAssetsState>()(
  persist(
    (set, get) => ({
      favoriteAssetIds: [],
      starredFilter: false,
      toggleFavorite: (assetId: string) => {
        set((state) => {
          const isFav = state.favoriteAssetIds.includes(assetId);
          return {
            favoriteAssetIds: isFav
              ? state.favoriteAssetIds.filter((id) => id !== assetId)
              : [...state.favoriteAssetIds, assetId]
          };
        });
      },
      addFavorite: (assetId: string) => {
        set((state) => {
          if (state.favoriteAssetIds.includes(assetId)) {
            return state;
          }
          return {
            favoriteAssetIds: [...state.favoriteAssetIds, assetId]
          };
        });
      },
      removeFavorite: (assetId: string) => {
        set((state) => ({
          favoriteAssetIds: state.favoriteAssetIds.filter((id) => id !== assetId)
        }));
      },
      isFavorite: (assetId: string) => {
        return get().favoriteAssetIds.includes(assetId);
      },
      setStarredFilter: (on: boolean) => {
        set({ starredFilter: on });
      },
      toggleStarredFilter: () => {
        set((state) => ({ starredFilter: !state.starredFilter }));
      },
      clearAll: () => {
        set({ favoriteAssetIds: [], starredFilter: false });
      }
    }),
    {
      name: "favorite-assets",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favoriteAssetIds: state.favoriteAssetIds,
        starredFilter: state.starredFilter
      }),
      migrate: (persistedState, _version) => {
        if (
          !persistedState ||
          typeof persistedState !== "object" ||
          Array.isArray(persistedState)
        ) {
          return { favoriteAssetIds: [], starredFilter: false };
        }
        const state = persistedState as Record<string, unknown>;
        return {
          favoriteAssetIds: Array.isArray(state.favoriteAssetIds)
            ? state.favoriteAssetIds.filter(
                (id): id is string => typeof id === "string"
              )
            : [],
          starredFilter: state.starredFilter === true
        };
      }
    }
  )
);

export interface FavoriteAssetActions {
  toggleFavorite: (assetId: string) => void;
  addFavorite: (assetId: string) => void;
  removeFavorite: (assetId: string) => void;
  isFavorite: (assetId: string) => boolean;
  setStarredFilter: (on: boolean) => void;
  toggleStarredFilter: () => void;
  clearAll: () => void;
}

export const useFavoriteAssetActions = (): FavoriteAssetActions =>
  useFavoriteAssetsStore(
    useShallow((state) => ({
      toggleFavorite: state.toggleFavorite,
      addFavorite: state.addFavorite,
      removeFavorite: state.removeFavorite,
      isFavorite: state.isFavorite,
      setStarredFilter: state.setStarredFilter,
      toggleStarredFilter: state.toggleStarredFilter,
      clearAll: state.clearAll
    }))
  );

export const useIsAssetFavorite = (assetId: string): boolean =>
  useFavoriteAssetsStore((state) => state.favoriteAssetIds.includes(assetId));

export const useFavoriteAssetIds = (): string[] =>
  useFavoriteAssetsStore((state) => state.favoriteAssetIds);

export const useStarredAssetFilter = (): boolean =>
  useFavoriteAssetsStore((state) => state.starredFilter);

export const forgetStarredAssets = (assetIds: string[]): void => {
  const { removeFavorite } = useFavoriteAssetsStore.getState();
  for (const id of assetIds) {
    removeFavorite(id);
  }
};
