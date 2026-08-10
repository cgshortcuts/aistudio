import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  arkPoll,
  arkSubmit,
  buildTaskBody,
  getApiKey,
  pickVideoUrl,
  retryAfterMs
} from "../src/byteplus-base.js";
import {
  resolveModelId,
  resolveSeedance25ModelId,
  SEEDANCE_25_MODEL_ENV,
  SEEDANCE_25_MODEL_ID_DEFAULT
} from "../src/byteplus-models.js";
import { isSafeHttpUrl } from "../src/byteplus-assets.js";

describe("getApiKey", () => {
  const originalByteplus = process.env.BYTEPLUS_API_KEY;
  const originalArk = process.env.ARK_API_KEY;

  afterEach(() => {
    if (originalByteplus !== undefined) {
      process.env.BYTEPLUS_API_KEY = originalByteplus;
    } else {
      delete process.env.BYTEPLUS_API_KEY;
    }
    if (originalArk !== undefined) {
      process.env.ARK_API_KEY = originalArk;
    } else {
      delete process.env.ARK_API_KEY;
    }
  });

  it("returns key from secrets", () => {
    expect(getApiKey({ BYTEPLUS_API_KEY: "from-secrets" })).toBe("from-secrets");
  });

  it("accepts ARK_API_KEY in secrets", () => {
    expect(getApiKey({ ARK_API_KEY: "ark-secret" })).toBe("ark-secret");
  });

  it("falls back to ARK_API_KEY env", () => {
    delete process.env.BYTEPLUS_API_KEY;
    process.env.ARK_API_KEY = "env-ark";
    expect(getApiKey({})).toBe("env-ark");
  });

  it("throws when missing", () => {
    delete process.env.BYTEPLUS_API_KEY;
    delete process.env.ARK_API_KEY;
    expect(() => getApiKey({})).toThrow(/BYTEPLUS_API_KEY/);
  });
});

describe("buildTaskBody", () => {
  it("builds text-to-video content", () => {
    const body = buildTaskBody("dreamina-seedance-2-0-260128", {
      prompt: "a red fox",
      duration: 5,
      resolution: "720p",
      ratio: "16:9",
      generate_audio: true,
      watermark: false
    });
    expect(body.model).toBe("dreamina-seedance-2-0-260128");
    expect(body.content).toEqual([{ type: "text", text: "a red fox" }]);
    expect(body.duration).toBe(5);
    expect(body.resolution).toBe("720p");
    expect(body.ratio).toBe("16:9");
    expect(body.generate_audio).toBe(true);
    expect(body.watermark).toBe(false);
  });

  it("maps first/last frame images", () => {
    const body = buildTaskBody("m", {
      prompt: "move",
      image: "https://cdn.example.com/a.png",
      last_image: "https://cdn.example.com/b.png"
    });
    expect(body.content).toEqual([
      { type: "text", text: "move" },
      {
        type: "image_url",
        image_url: { url: "https://cdn.example.com/a.png" },
        role: "first_frame"
      },
      {
        type: "image_url",
        image_url: { url: "https://cdn.example.com/b.png" },
        role: "last_frame"
      }
    ]);
  });

  it("maps reference media lists", () => {
    const body = buildTaskBody("m", {
      prompt: "use Image 1",
      reference_images: ["https://cdn.example.com/i.png"],
      reference_videos: ["https://cdn.example.com/v.mp4"],
      reference_audios: ["https://cdn.example.com/a.mp3"]
    });
    expect(body.content).toHaveLength(4);
    expect(body.content[1]).toMatchObject({
      type: "image_url",
      role: "reference_image"
    });
    expect(body.content[2]).toMatchObject({
      type: "video_url",
      role: "reference_video"
    });
    expect(body.content[3]).toMatchObject({
      type: "audio_url",
      role: "reference_audio"
    });
  });

  it("throws when content would be empty", () => {
    expect(() => buildTaskBody("m", {})).toThrow(/prompt/);
  });
});

describe("resolveSeedance25ModelId", () => {
  const original = process.env[SEEDANCE_25_MODEL_ENV];

  afterEach(() => {
    if (original !== undefined) {
      process.env[SEEDANCE_25_MODEL_ENV] = original;
    } else {
      delete process.env[SEEDANCE_25_MODEL_ENV];
    }
  });

  it("defaults to provisional id", () => {
    delete process.env[SEEDANCE_25_MODEL_ENV];
    expect(resolveSeedance25ModelId()).toBe(SEEDANCE_25_MODEL_ID_DEFAULT);
  });

  it("honors env override via resolveModelId", () => {
    process.env[SEEDANCE_25_MODEL_ENV] = "console-owned-id";
    expect(resolveModelId("fallback", SEEDANCE_25_MODEL_ENV)).toBe(
      "console-owned-id"
    );
  });
});

describe("retryAfterMs", () => {
  it("parses seconds", () => {
    expect(retryAfterMs("2", 1000)).toBe(2000);
  });

  it("falls back when missing", () => {
    expect(retryAfterMs(null, 1500)).toBe(1500);
  });
});

describe("isSafeHttpUrl", () => {
  it("allows public https", () => {
    expect(isSafeHttpUrl("https://cdn.example.com/a.png")).toBe(true);
  });

  it("blocks localhost", () => {
    expect(isSafeHttpUrl("http://127.0.0.1/secret")).toBe(false);
    expect(isSafeHttpUrl("http://localhost/x")).toBe(false);
  });
});

describe("arkSubmit / arkPoll (mocked fetch)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.fetch = originalFetch;
  });

  it("submits without retry and returns task id", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "cgt-1" }), { status: 200 })
    );
    const id = await arkSubmit("key", {
      model: "m",
      content: [{ type: "text", text: "hi" }]
    });
    expect(id).toBe("cgt-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry a failed submit", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      new Response("boom", { status: 500 })
    );
    await expect(
      arkSubmit("key", { model: "m", content: [{ type: "text", text: "hi" }] })
    ).rejects.toThrow(/submit 500/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("polls until succeeded", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "running" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "succeeded",
            content: { video_url: "https://cdn.example.com/out.mp4" }
          }),
          { status: 200 }
        )
      );
    const result = await arkPoll("key", "cgt-1", {
      pollInterval: 1,
      maxAttempts: 5
    });
    expect(pickVideoUrl(result)).toBe("https://cdn.example.com/out.mp4");
  });

  it("fails closed on failed status", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "failed",
          error: { message: "quota" }
        }),
        { status: 200 }
      )
    );
    await expect(
      arkPoll("key", "cgt-1", { pollInterval: 1, maxAttempts: 3 })
    ).rejects.toThrow(/quota/);
  });
});
