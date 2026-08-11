/**
 * @jest-environment node
 */
import { exampleThumbnailKind } from "../thumbnailKind";

describe("exampleThumbnailKind", () => {
  it("picks a specific icon from the example name", () => {
    expect(exampleThumbnailKind({ name: "Image Fill", tags: ["image"] })).toBe(
      "imageFill"
    );
    expect(exampleThumbnailKind({ name: "Relight", tags: ["image"] })).toBe(
      "imageRelight"
    );
    expect(
      exampleThumbnailKind({ name: "Background Removal", tags: ["image"] })
    ).toBe("imageCutout");
    expect(
      exampleThumbnailKind({ name: "Image to Video", tags: ["video"] })
    ).toBe("videoAnimate");
    expect(
      exampleThumbnailKind({ name: "Motion Control", tags: ["video"] })
    ).toBe("videoMotion");
    expect(exampleThumbnailKind({ name: "Text to 3D", tags: ["3d"] })).toBe(
      "model3d"
    );
    expect(
      exampleThumbnailKind({ name: "Music Generator", tags: ["audio"] })
    ).toBe("audioMusic");
    expect(
      exampleThumbnailKind({ name: "Voice Narration", tags: ["audio"] })
    ).toBe("audioVoice");
    expect(
      exampleThumbnailKind({ name: "Video to Audio", tags: ["audio"] })
    ).toBe("audioFoley");
  });

  it("falls back to tags when the name has no keyword", () => {
    expect(exampleThumbnailKind({ tags: ["3d", "image"] })).toBe("model3d");
    expect(exampleThumbnailKind({ tags: ["video"] })).toBe("videoGenerate");
    expect(exampleThumbnailKind({ tags: ["image"] })).toBe("imageGenerate");
    expect(exampleThumbnailKind({ tags: ["audio"] })).toBe("audioVoice");
    expect(exampleThumbnailKind({ tags: ["agents"] })).toBe("agent");
    expect(exampleThumbnailKind({ tags: ["text"] })).toBe("text");
  });

  it("uses sparkles when nothing matches", () => {
    expect(exampleThumbnailKind({ tags: [], name: "Untitled" })).toBe(
      "sparkles"
    );
  });
});
