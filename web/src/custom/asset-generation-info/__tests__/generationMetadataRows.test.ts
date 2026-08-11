import { buildGenerationInfoRows } from "../generationMetadataRows";
import type { Asset } from "../../../stores/ApiTypes";

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "a1",
    user_id: "1",
    parent_id: null,
    name: "gen.png",
    content_type: "image/png",
    size: 100,
    metadata: null,
    workflow_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    get_url: "/api/storage/1/a1.png",
    thumb_url: null,
    ...overrides
  };
}

describe("buildGenerationInfoRows", () => {
  it("returns empty when there is no generation metadata or local path", () => {
    expect(buildGenerationInfoRows(makeAsset())).toEqual([]);
  });

  it("surfaces prompt, model, provider, cost, time, and dimensions", () => {
    const rows = buildGenerationInfoRows(
      makeAsset({
        metadata: {
          prompt: "a red fox",
          model: "flux/schnell",
          provider: "fal",
          cost: 0.003,
          cost_currency: "USD",
          duration_ms: 2400,
          resolution: "1K",
          pixel_width: 1024,
          pixel_height: 1024,
          width: 1024,
          height: 1024,
          generation_index: 0
        }
      })
    );
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]));
    expect(byLabel.Prompt.value).toBe("a red fox");
    expect(byLabel.Model.value).toBe("flux/schnell");
    expect(byLabel.Provider.value).toBe("fal");
    expect(byLabel.Cost.value).toMatch(/\$0\.003/);
    expect(byLabel.Time.value).toBe("2.4 s");
    expect(byLabel.Resolution.value).toBe("1K");
    expect(byLabel.Dimensions.value).toBe("1024 × 1024");
    expect(rows.find((r) => r.label === "generation_index")).toBeUndefined();
  });

  it("adds an openable Location row when local_path is set", () => {
    const rows = buildGenerationInfoRows(
      makeAsset({
        local_path: "C:\\data\\assets\\1\\a1.png",
        metadata: { prompt: "x" }
      })
    );
    const location = rows.find((r) => r.label === "Location");
    expect(location?.value).toBe("C:\\data\\assets\\1\\a1.png");
    expect(location?.openPath).toBe("C:\\data\\assets\\1\\a1.png");
  });
});
