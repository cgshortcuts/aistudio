import { connectedCreditProviders, CREDIT_PROVIDERS } from "../creditProviders";

describe("connectedCreditProviders", () => {
  it("returns no providers when secrets are empty", () => {
    expect(connectedCreditProviders([])).toEqual([]);
  });

  it("returns only providers whose secret is configured", () => {
    const result = connectedCreditProviders([
      { key: "FAL_API_KEY", is_configured: true },
      { key: "KIE_API_KEY", is_configured: false },
      { key: "ATLASCLOUD_API_KEY", is_configured: true },
      { key: "OPENAI_API_KEY", is_configured: true },
    ]);
    expect(result.map((p) => p.id)).toEqual(["fal", "atlascloud"]);
  });

  it("returns all three when all credit secrets are configured", () => {
    const result = connectedCreditProviders(
      CREDIT_PROVIDERS.map((p) => ({
        key: p.secretKey,
        is_configured: true,
      })),
    );
    expect(result.map((p) => p.id)).toEqual(["fal", "kie", "atlascloud"]);
  });

  it("ignores unconfigured matching keys", () => {
    const result = connectedCreditProviders([
      { key: "KIE_API_KEY", is_configured: false },
    ]);
    expect(result).toEqual([]);
  });
});
