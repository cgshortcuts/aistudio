import { describe, it, expect, vi, beforeEach } from "vitest";
import { getModelUnitPrice } from "@nodetool-ai/model-pricing";
import {
  estimateAtlasCloudCost,
  inferAtlasCloudQuantity,
  reportAtlasCloudCost
} from "../src/atlascloud-cost.js";

vi.mock("@nodetool-ai/model-pricing", () => ({
  getModelUnitPrice: vi.fn()
}));

const getPrice = vi.mocked(getModelUnitPrice);

describe("inferAtlasCloudQuantity", () => {
  it("uses variations for per-image billing", () => {
    expect(inferAtlasCloudQuantity("images", { variations: 4 })).toBe(4);
    expect(inferAtlasCloudQuantity("image", { num_images: 2 })).toBe(2);
    expect(inferAtlasCloudQuantity("images", {})).toBe(1);
  });

  it("uses duration for per-second billing and ignores auto-length", () => {
    expect(inferAtlasCloudQuantity("seconds", { duration: 8 })).toBe(8);
    expect(inferAtlasCloudQuantity("seconds", { durationSeconds: 5 })).toBe(5);
    expect(inferAtlasCloudQuantity("seconds", { duration: -1 })).toBe(1);
    expect(inferAtlasCloudQuantity("seconds", {})).toBe(1);
  });
});

describe("estimateAtlasCloudCost", () => {
  beforeEach(() => {
    getPrice.mockReset();
  });

  it("multiplies the GenSpend unit price by duration for video", () => {
    getPrice.mockReturnValue({
      unit_price: 0.09,
      billing_unit: "seconds",
      currency: "USD",
      source: "bundle"
    });
    expect(
      estimateAtlasCloudCost("bytedance/seedance-2.0/text-to-video", {
        duration: 5
      })
    ).toEqual({
      provider: "atlascloud",
      model: "bytedance/seedance-2.0/text-to-video",
      cost: 0.45,
      unitPrice: 0.09,
      quantity: 5,
      billingUnit: "seconds",
      currency: "USD"
    });
    expect(getPrice).toHaveBeenCalledWith({
      id: "bytedance/seedance-2.0/text-to-video",
      provider: "atlascloud"
    });
  });

  it("returns null when GenSpend has no price", () => {
    getPrice.mockReturnValue(null);
    expect(estimateAtlasCloudCost("unknown/model")).toBeNull();
  });

  it("returns null for vague billing units", () => {
    getPrice.mockReturnValue({
      unit_price: 1,
      billing_unit: "units",
      currency: "USD",
      source: "bundle"
    });
    expect(estimateAtlasCloudCost("x")).toBeNull();
  });
});

describe("reportAtlasCloudCost", () => {
  beforeEach(() => {
    getPrice.mockReset();
    getPrice.mockReturnValue({
      unit_price: 0.032,
      billing_unit: "images",
      currency: "USD",
      source: "bundle"
    });
  });

  it("writes the estimate onto the processing context", () => {
    const setProviderCost = vi.fn();
    reportAtlasCloudCost(
      { setProviderCost },
      "bytedance/seedream-v5.0-lite",
      { variations: 2 },
      "pred-1"
    );
    expect(setProviderCost).toHaveBeenCalledWith("atlascloud", 0.064, "USD", {
      model: "bytedance/seedream-v5.0-lite",
      billing_unit: "images",
      quantity: 2,
      unit_price: 0.032,
      currency: "USD",
      provider_request_id: "pred-1"
    });
  });

  it("skips when the context has no setter", () => {
    expect(() =>
      reportAtlasCloudCost(null, "bytedance/seedream-v5.0-lite")
    ).not.toThrow();
  });

  it("skips when the model is unpriced", () => {
    getPrice.mockReturnValue(null);
    const setProviderCost = vi.fn();
    reportAtlasCloudCost({ setProviderCost }, "unknown/model");
    expect(setProviderCost).not.toHaveBeenCalled();
  });
});
