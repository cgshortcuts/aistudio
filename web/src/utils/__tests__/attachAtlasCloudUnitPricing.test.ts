/** @jest-environment node */

jest.mock("@nodetool/atlascloud-manifest", () => ({
  __esModule: true,
  default: [
    {
      className: "Seedance2TextToVideo",
      moduleName: "video",
      modelId: "bytedance/seedance-2.0/text-to-video"
    },
    {
      className: "Unpriced",
      moduleName: "image",
      modelId: "unknown/model"
    }
  ]
}));

jest.mock("@nodetool-ai/model-pricing/genspend-catalog", () => ({
  genspendPricingCatalog: { updatedAt: "2026-07-30T08:45:27.754Z" }
}));

jest.mock("../modelUnitPricing", () => ({
  getModelUnitPrice: jest.fn()
}));

import type { NodeMetadata } from "../../stores/ApiTypes";
import { getModelUnitPrice } from "../modelUnitPricing";
import { attachAtlasCloudUnitPricing } from "../attachAtlasCloudUnitPricing";

function meta(
  over: Partial<NodeMetadata> & { node_type: string }
): NodeMetadata {
  return over as NodeMetadata;
}

const getPrice = getModelUnitPrice as jest.Mock;

describe("attachAtlasCloudUnitPricing", () => {
  beforeEach(() => {
    getPrice.mockReset();
    getPrice.mockImplementation((model: { id: string; provider: string }) =>
      model.id === "bytedance/seedance-2.0/text-to-video"
        ? {
            unit_price: 0.09,
            billing_unit: "seconds",
            currency: "USD",
            source: "bundle"
          }
        : null
    );
  });

  it("attaches GenSpend pricing when metadata has none", () => {
    const metadata = {
      "atlascloud.video.Seedance2TextToVideo": meta({
        node_type: "atlascloud.video.Seedance2TextToVideo"
      })
    };
    attachAtlasCloudUnitPricing(metadata);
    expect(
      metadata["atlascloud.video.Seedance2TextToVideo"].atlascloud_unit_pricing
    ).toEqual({
      model_id: "bytedance/seedance-2.0/text-to-video",
      unit_price: 0.09,
      billing_unit: "seconds",
      currency: "USD",
      source: "bundle",
      checked_at: "2026-07-30T08:45:27.754Z"
    });
    expect(getPrice).toHaveBeenCalledWith({
      id: "bytedance/seedance-2.0/text-to-video",
      provider: "atlascloud"
    });
  });

  it("does not overwrite live pricing", () => {
    const livePricing = {
      model_id: "bytedance/seedance-2.0/text-to-video",
      unit_price: 0.12,
      billing_unit: "seconds",
      currency: "USD",
      source: "live" as const,
      checked_at: "2026-01-13T00:00:00Z"
    };
    const metadata = {
      "atlascloud.video.Seedance2TextToVideo": meta({
        node_type: "atlascloud.video.Seedance2TextToVideo",
        atlascloud_unit_pricing: { ...livePricing }
      })
    };
    attachAtlasCloudUnitPricing(metadata);
    expect(
      metadata["atlascloud.video.Seedance2TextToVideo"].atlascloud_unit_pricing
    ).toEqual(livePricing);
  });

  it("skips entries with no GenSpend price", () => {
    const metadata = {
      "atlascloud.image.Unpriced": meta({
        node_type: "atlascloud.image.Unpriced"
      })
    };
    attachAtlasCloudUnitPricing(metadata);
    expect(
      metadata["atlascloud.image.Unpriced"].atlascloud_unit_pricing
    ).toBeUndefined();
  });

  it("skips node types not in metadata", () => {
    const metadata = {
      "atlascloud.other.Missing": meta({
        node_type: "atlascloud.other.Missing"
      })
    };
    attachAtlasCloudUnitPricing(metadata);
    expect(
      metadata["atlascloud.other.Missing"].atlascloud_unit_pricing
    ).toBeUndefined();
  });
});
