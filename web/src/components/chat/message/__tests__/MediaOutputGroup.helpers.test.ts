/**
 * @jest-environment node
 */
import {
  isImageContent,
  isVideoContent,
  isAudioContent,
  isModel3DContent,
  isMediaOnlyContent
} from "../MediaOutputGroup.helpers";
import type {
  MessageContent,
  MessageImageContent,
  MessageVideoContent,
  MessageAudioContent,
  MessageModel3DContent
} from "../../../../stores/ApiTypes";

const img: MessageImageContent = {
  type: "image_url",
  image: { type: "image", uri: "x" }
};

const vid: MessageVideoContent = {
  type: "video",
  video: { type: "video", uri: "x" }
};

const aud: MessageAudioContent = {
  type: "audio",
  audio: { type: "audio", uri: "x" }
};

const model3d: MessageModel3DContent = {
  type: "model_3d",
  model_3d: { type: "model_3d", asset_id: "m3d" }
};

describe("isImageContent", () => {
  it("returns true for image_url type", () => {
    expect(isImageContent(img)).toBe(true);
  });

  it("returns false for other types", () => {
    expect(isImageContent(vid as unknown as MessageContent)).toBe(false);
    expect(isImageContent({ type: "text", text: "" } as MessageContent)).toBe(false);
  });
});

describe("isVideoContent", () => {
  it("returns true for video type", () => {
    expect(isVideoContent(vid)).toBe(true);
  });

  it("returns false for other types", () => {
    expect(isVideoContent(img as unknown as MessageContent)).toBe(false);
  });
});

describe("isAudioContent", () => {
  it("returns true for audio type", () => {
    expect(isAudioContent(aud)).toBe(true);
  });

  it("returns false for other types", () => {
    expect(isAudioContent({ type: "text", text: "" } as MessageContent)).toBe(false);
  });
});

describe("isModel3DContent", () => {
  it("returns true for model_3d type", () => {
    expect(isModel3DContent(model3d)).toBe(true);
  });

  it("returns false for other types", () => {
    expect(isModel3DContent(aud as unknown as MessageContent)).toBe(false);
  });
});

describe("isMediaOnlyContent", () => {
  it("returns true for array of only media items", () => {
    expect(isMediaOnlyContent([img, vid, aud, model3d])).toBe(true);
  });

  it("returns false for empty array", () => {
    expect(isMediaOnlyContent([])).toBe(false);
  });

  it("returns false for non-array", () => {
    expect(isMediaOnlyContent(null)).toBe(false);
    expect(isMediaOnlyContent(undefined)).toBe(false);
    expect(isMediaOnlyContent("string")).toBe(false);
    expect(isMediaOnlyContent(42)).toBe(false);
  });

  it("returns false when text content is mixed in", () => {
    const content: MessageContent[] = [
      img,
      { type: "text", text: "hello" }
    ];
    expect(isMediaOnlyContent(content)).toBe(false);
  });

  it("returns false when array contains null entries", () => {
    expect(isMediaOnlyContent([null, img])).toBe(false);
  });

  it("returns true for single media item", () => {
    expect(isMediaOnlyContent([aud])).toBe(true);
    expect(isMediaOnlyContent([model3d])).toBe(true);
  });
});
