import { resolveAiStudioProduct } from "../product-profile";

describe("resolveAiStudioProduct", () => {
  it("defaults unpackaged to full and packaged to customer", () => {
    expect(resolveAiStudioProduct(false, {})).toBe("full");
    expect(resolveAiStudioProduct(true, {})).toBe("customer");
  });

  it("lets an explicit env value win over packaged/dev defaults", () => {
    expect(
      resolveAiStudioProduct(true, { AISTUDIO_PRODUCT: "full" })
    ).toBe("full");
    expect(
      resolveAiStudioProduct(false, { AISTUDIO_PRODUCT: "customer" })
    ).toBe("customer");
  });

  it("ignores unknown values and falls back to the packaged/dev default", () => {
    expect(
      resolveAiStudioProduct(true, { AISTUDIO_PRODUCT: "beta" })
    ).toBe("customer");
  });
});
