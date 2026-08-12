/**
 * @jest-environment node
 */
import {
  atlascloudCreditsDetailSuggestsKeysLink,
  formatAtlascloudCredits,
} from "../atlascloudCredits";
import type { AtlascloudCredits } from "../atlascloudCredits";

describe("atlascloudCreditsDetailSuggestsKeysLink", () => {
  it("returns false for null/undefined/empty", () => {
    expect(atlascloudCreditsDetailSuggestsKeysLink(undefined)).toBe(false);
    expect(atlascloudCreditsDetailSuggestsKeysLink("")).toBe(false);
    expect(atlascloudCreditsDetailSuggestsKeysLink("   ")).toBe(false);
  });

  it('returns false when detail contains "reach atlascloud"', () => {
    expect(
      atlascloudCreditsDetailSuggestsKeysLink("Could not reach AtlasCloud"),
    ).toBe(false);
  });

  it('returns false when detail contains "try again later"', () => {
    expect(
      atlascloudCreditsDetailSuggestsKeysLink(
        "Service unavailable, try again later",
      ),
    ).toBe(false);
  });

  it("returns true for other error details", () => {
    expect(atlascloudCreditsDetailSuggestsKeysLink("Invalid API key")).toBe(
      true,
    );
  });
});

describe("formatAtlascloudCredits", () => {
  it('returns "N/A" when credit_balance is undefined', () => {
    expect(formatAtlascloudCredits({})).toBe("N/A");
  });

  it("formats a plain number balance", () => {
    expect(formatAtlascloudCredits({ credit_balance: 12.5 })).toBe("$12.50");
    expect(formatAtlascloudCredits({ credit_balance: 0 })).toBe("$0.00");
  });

  it("formats an object balance with amount and currency", () => {
    const data: AtlascloudCredits = {
      credit_balance: { amount: 125.5, currency: "USD" },
    };
    const result = formatAtlascloudCredits(data);
    expect(result).toContain("125.5");
  });

  it('returns "N/A" when amount is missing from the object', () => {
    const data: AtlascloudCredits = {
      credit_balance: { currency: "USD" },
    };
    expect(formatAtlascloudCredits(data)).toBe("N/A");
  });
});
