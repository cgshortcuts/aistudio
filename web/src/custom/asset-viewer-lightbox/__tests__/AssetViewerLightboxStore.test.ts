import { act } from "@testing-library/react";
import { useAssetViewerLightboxStore } from "../AssetViewerLightboxStore";

describe("AssetViewerLightboxStore", () => {
  beforeEach(() => {
    act(() => {
      useAssetViewerLightboxStore.setState({ showInfo: false });
    });
  });

  it("toggles showInfo", () => {
    expect(useAssetViewerLightboxStore.getState().showInfo).toBe(false);
    act(() => {
      useAssetViewerLightboxStore.getState().toggleShowInfo();
    });
    expect(useAssetViewerLightboxStore.getState().showInfo).toBe(true);
    act(() => {
      useAssetViewerLightboxStore.getState().toggleShowInfo();
    });
    expect(useAssetViewerLightboxStore.getState().showInfo).toBe(false);
  });

  it("sets showInfo explicitly", () => {
    act(() => {
      useAssetViewerLightboxStore.getState().setShowInfo(true);
    });
    expect(useAssetViewerLightboxStore.getState().showInfo).toBe(true);
  });
});
