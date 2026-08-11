import { create } from "zustand";

import type { AssetSearchFocusSurface } from "./assetSearchAutofocusSurface";

interface AssetSearchAutofocusState {
  generation: number;
  surface: AssetSearchFocusSurface | null;
  requestFocus: (surface: AssetSearchFocusSurface) => void;
}

export const useAssetSearchAutofocusStore = create<AssetSearchAutofocusState>(
  (set) => ({
    generation: 0,
    surface: null,
    requestFocus: (surface) =>
      set((state) => ({
        generation: state.generation + 1,
        surface
      }))
  })
);

export function requestAssetSearchFocus(
  surface: AssetSearchFocusSurface
): void {
  useAssetSearchAutofocusStore.getState().requestFocus(surface);
}

export function resetAssetSearchAutofocusStore(): void {
  useAssetSearchAutofocusStore.setState({
    generation: 0,
    surface: null
  });
}
