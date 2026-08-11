import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@nodetool-ai/atlascloud-nodes/cost", () => ({
  estimateAtlasCloudCost: vi.fn()
}));

vi.mock("@nodetool-ai/models", () => ({
  Prediction: { create: vi.fn() }
}));

import { estimateAtlasCloudCost } from "@nodetool-ai/atlascloud-nodes/cost";
import { Prediction } from "@nodetool-ai/models";
import { persistAtlasCloudMediaCost } from "../src/atlascloud-media-cost.js";

const estimate = vi.mocked(estimateAtlasCloudCost);
const create = vi.mocked(Prediction.create);

describe("persistAtlasCloudMediaCost", () => {
  beforeEach(() => {
    estimate.mockReset();
    create.mockReset();
    create.mockResolvedValue({});
  });

  it("writes a prediction row for an AtlasCloud generation", async () => {
    estimate.mockReturnValue({
      provider: "atlascloud",
      model: "bytedance/seedance-2.0/text-to-video",
      cost: 0.45,
      unitPrice: 0.09,
      quantity: 5,
      billingUnit: "seconds",
      currency: "USD"
    });

    const result = await persistAtlasCloudMediaCost({
      userId: "u1",
      providerId: "atlascloud",
      modelId: "bytedance/seedance-2.0/text-to-video",
      workflowId: null,
      args: { duration: 5 }
    });

    expect(result).toEqual({ cost: 0.45, currency: "USD" });
    expect(estimate).toHaveBeenCalledWith(
      "bytedance/seedance-2.0/text-to-video",
      { duration: 5 }
    );
    expect(create).toHaveBeenCalledWith({
      user_id: "u1",
      provider: "atlascloud",
      model: "bytedance/seedance-2.0/text-to-video",
      node_type: "atlascloud.media",
      cost: 0.45,
      currency: "USD",
      billing_unit: "seconds",
      quantity: 5,
      unit_price: 0.09,
      workflow_id: null,
      node_id: "",
      status: "completed"
    });
  });

  it("skips other providers", async () => {
    const result = await persistAtlasCloudMediaCost({
      userId: "u1",
      providerId: "fal_ai",
      modelId: "fal-ai/flux/schnell",
      workflowId: null
    });
    expect(result).toBeNull();
    expect(estimate).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("skips when GenSpend has no price", async () => {
    estimate.mockReturnValue(null);
    await persistAtlasCloudMediaCost({
      userId: "u1",
      providerId: "atlascloud",
      modelId: "unknown/model",
      workflowId: null
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("skips a zero estimate", async () => {
    estimate.mockReturnValue({
      provider: "atlascloud",
      model: "x",
      cost: 0,
      unitPrice: 0,
      quantity: 1,
      billingUnit: "images",
      currency: "USD"
    });
    await persistAtlasCloudMediaCost({
      userId: "u1",
      providerId: "atlascloud",
      modelId: "x",
      workflowId: null
    });
    expect(create).not.toHaveBeenCalled();
  });
});
