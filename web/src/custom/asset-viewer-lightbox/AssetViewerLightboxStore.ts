import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AssetViewerLightboxState {
  showInfo: boolean;
  setShowInfo: (showInfo: boolean) => void;
  toggleShowInfo: () => void;
}

export const useAssetViewerLightboxStore = create<AssetViewerLightboxState>()(
  persist(
    (set) => ({
      showInfo: false,
      setShowInfo: (showInfo) => set({ showInfo }),
      toggleShowInfo: () => set((state) => ({ showInfo: !state.showInfo }))
    }),
    {
      name: "nodetool-asset-viewer-lightbox",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ showInfo: state.showInfo })
    }
  )
);
