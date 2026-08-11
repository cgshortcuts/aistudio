import { describe, it, expect } from "vitest";
import {
  buildGenerationMetadata,
  readModelSlot
} from "../src/lib/generation-asset-metadata.js";

describe("buildGenerationMetadata", () => {
  it("caps a long prompt and lifts model/provider/resolution", () => {
    const meta = buildGenerationMetadata({
      prompt: "a".repeat(9000),
      model: "flux/schnell",
      provider: "fal",
      resolution: "1080p",
      width: 1920,
      height: 1080
    });
    expect((meta.prompt as string).length).toBe(8000);
    expect(meta.model).toBe("flux/schnell");
    expect(meta.provider).toBe("fal");
    expect(meta.resolution).toBe("1080p");
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
  });

  it("flattens a model-slot object", () => {
    const meta = buildGenerationMetadata({
      prompt: "hi",
      model: {
        type: "image_model",
        id: "fal-ai/flux/schnell",
        name: "Flux Schnell",
        provider: "fal_ai"
      }
    });
    expect(meta.model).toBe("fal-ai/flux/schnell");
    expect(meta.provider).toBe("fal_ai");
  });

  it("merges extras without overwriting with empties", () => {
    const meta = buildGenerationMetadata(
      { prompt: "x" },
      { cost: 0.01, cost_currency: "USD", duration_ms: 500 }
    );
    expect(meta).toEqual({
      prompt: "x",
      cost: 0.01,
      cost_currency: "USD",
      duration_ms: 500
    });
  });
});

describe("readModelSlot", () => {
  it("returns null for non-model objects", () => {
    expect(readModelSlot({ uri: "asset://x" })).toBeNull();
    expect(readModelSlot("plain")).toBeNull();
  });
});
