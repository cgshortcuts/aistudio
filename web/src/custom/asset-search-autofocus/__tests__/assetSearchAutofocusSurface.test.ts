import { assetSearchAutofocusSurface } from "../assetSearchAutofocusSurface";

describe("assetSearchAutofocusSurface", () => {
  it("returns library for the global library sidebar", () => {
    expect(
      assetSearchAutofocusSurface({
        forceGlobalAssets: true
      })
    ).toBe("library");
  });

  it("returns undefined for other asset grids", () => {
    expect(
      assetSearchAutofocusSurface({
        forceGlobalAssets: false
      })
    ).toBeUndefined();
  });
});
