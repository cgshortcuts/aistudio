import { assetSearchAutofocusSurface } from "../assetSearchAutofocusSurface";

describe("assetSearchAutofocusSurface", () => {
  it("returns library for the global library sidebar", () => {
    expect(
      assetSearchAutofocusSurface({
        forceGlobalAssets: true,
        isFullscreenAssets: false
      })
    ).toBe("library");
  });

  it("returns assets-page for the fullscreen assets explorer", () => {
    expect(
      assetSearchAutofocusSurface({
        forceGlobalAssets: false,
        isFullscreenAssets: true
      })
    ).toBe("assets-page");
  });

  it("returns undefined for workflow-output assets", () => {
    expect(
      assetSearchAutofocusSurface({
        forceGlobalAssets: false,
        isFullscreenAssets: false
      })
    ).toBeUndefined();
  });
});
