import { describe, it, expect } from "vitest";
import {
  AISTUDIO_PRODUCT_ENV,
  isAiStudioCustomerProduct,
  isAiStudioHiddenExample,
  isAiStudioHiddenExampleRecord,
  isAiStudioHiddenNodeType
} from "../src/aistudio-product-profile.js";

describe("isAiStudioCustomerProduct", () => {
  it("is off unless AISTUDIO_PRODUCT is customer", () => {
    expect(isAiStudioCustomerProduct({})).toBe(false);
    expect(isAiStudioCustomerProduct({ [AISTUDIO_PRODUCT_ENV]: "full" })).toBe(
      false
    );
    expect(
      isAiStudioCustomerProduct({ [AISTUDIO_PRODUCT_ENV]: "customer" })
    ).toBe(true);
  });
});

describe("isAiStudioHiddenNodeType", () => {
  it("matches agent, script, workspace, and vector namespaces", () => {
    expect(isAiStudioHiddenNodeType("nodetool.agents.ShellAgent")).toBe(true);
    expect(isAiStudioHiddenNodeType("nodetool.agents.Agent")).toBe(true);
    expect(isAiStudioHiddenNodeType("openai.agents.RealtimeAgent")).toBe(true);
    expect(isAiStudioHiddenNodeType("nodetool.script.LoadScript")).toBe(true);
    expect(isAiStudioHiddenNodeType("nodetool.workspace.ReadTextFile")).toBe(
      true
    );
    expect(isAiStudioHiddenNodeType("vector.Collection")).toBe(true);
    expect(isAiStudioHiddenNodeType("nodetool.image.LoadImage")).toBe(false);
    expect(isAiStudioHiddenNodeType("fal.image.TextToImage")).toBe(false);
  });

  it("hides chat, code, search, and browser nodes", () => {
    expect(isAiStudioHiddenNodeType("openai.text.Embedding")).toBe(true);
    expect(isAiStudioHiddenNodeType("gemini.text.GroundedSearch")).toBe(true);
    expect(isAiStudioHiddenNodeType("nodetool.code.Code")).toBe(true);
    expect(isAiStudioHiddenNodeType("search.google.GoogleSearch")).toBe(true);
    expect(isAiStudioHiddenNodeType("lib.browser.Browser")).toBe(true);
    expect(isAiStudioHiddenNodeType("huggingface.ChatCompletion")).toBe(true);
  });

  it("keeps OpenAI and Gemini image, video, and audio nodes", () => {
    expect(isAiStudioHiddenNodeType("openai.image.CreateImage")).toBe(false);
    expect(isAiStudioHiddenNodeType("gemini.image.ImageGeneration")).toBe(false);
    expect(isAiStudioHiddenNodeType("gemini.video.TextToVideo")).toBe(false);
    expect(isAiStudioHiddenNodeType("openai.audio.TextToSpeech")).toBe(false);
    expect(isAiStudioHiddenNodeType("huggingface.TextToImage")).toBe(false);
  });
});

describe("isAiStudioHiddenExample", () => {
  it("keeps generation templates in customer mode", () => {
    expect(
      isAiStudioHiddenExample(
        {
          name: "Audio To Image",
          tags: ["huggingface", "multimodal", "start"]
        },
        true
      )
    ).toBe(false);
    expect(
      isAiStudioHiddenExample(
        {
          name: "AI Product Launch Video Generator",
          tags: ["business", "data", "video"]
        },
        true
      )
    ).toBe(false);
    expect(
      isAiStudioHiddenExample(
        { name: "Transcribe Audio", tags: ["start", "audio", "huggingface"] },
        true
      )
    ).toBe(false);
  });

  it("hides Agents and Data & Web gallery examples", () => {
    expect(
      isAiStudioHiddenExample(
        { id: "data_generator", name: "Data Generator", tags: ["agents"] },
        true
      )
    ).toBe(true);
    expect(
      isAiStudioHiddenExample(
        {
          name: "Agent Google Search",
          tags: ["agent", "google", "search"]
        },
        true
      )
    ).toBe(true);
    expect(
      isAiStudioHiddenExample(
        { name: "Wikipedia Agent", tags: ["wikipedia", "research"] },
        true
      )
    ).toBe(true);
    expect(
      isAiStudioHiddenExample(
        {
          name: "Image To Audio Story",
          tags: ["start", "multimodal"]
        },
        true
      )
    ).toBe(true);
  });

  it("hides graphs that use agent nodes even without agent tags", () => {
    expect(
      isAiStudioHiddenExampleRecord(
        {
          name: "Prompt Helper",
          tags: ["image"],
          graph: {
            nodes: [{ id: "a", type: "nodetool.agents.Agent" }]
          }
        },
        {},
        true
      )
    ).toBe(true);
    expect(
      isAiStudioHiddenExampleRecord(
        {
          name: "Text To Image",
          tags: ["image"],
          graph: {
            nodes: [{ id: "g", type: "fal.image.TextToImage" }]
          }
        },
        {},
        true
      )
    ).toBe(false);
  });

  it("does not hide examples in full mode", () => {
    expect(
      isAiStudioHiddenExample(
        { name: "Agent Google Search", tags: ["agent"] },
        false
      )
    ).toBe(false);
  });
});
