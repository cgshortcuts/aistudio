import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WorkflowSuspendedError } from "@nodetool-ai/kernel";

const openaiMocks = vi.hoisted(() => ({
  submitImageBatch: vi.fn(),
  getImageBatch: vi.fn(),
  downloadImageBatchResults: vi.fn()
}));

const geminiMocks = vi.hoisted(() => ({
  submitImageBatch: vi.fn(),
  getImageBatch: vi.fn(),
  downloadImageBatchResults: vi.fn()
}));

vi.mock("@nodetool-ai/runtime", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@nodetool-ai/runtime")>();
  class MockOpenAIProvider {
    submitImageBatch = openaiMocks.submitImageBatch;
    getImageBatch = openaiMocks.getImageBatch;
    downloadImageBatchResults = openaiMocks.downloadImageBatchResults;
  }
  class MockGeminiProvider {
    submitImageBatch = geminiMocks.submitImageBatch;
    getImageBatch = geminiMocks.getImageBatch;
    downloadImageBatchResults = geminiMocks.downloadImageBatchResults;
  }
  return {
    ...actual,
    OpenAIProvider: MockOpenAIProvider,
    GeminiProvider: MockGeminiProvider
  };
});

import { CreateImageNode, EditImageNode } from "../src/nodes/openai.js";
import { ImageGenerationNode } from "../src/nodes/gemini.js";
import {
  awaitImageBatchOrSuspend,
  IMAGE_BATCH_KIND,
  IMAGE_BATCH_SUSPEND_REASON
} from "../src/lib/image-batch.js";

describe("awaitImageBatchOrSuspend", () => {
  it("returns images when the batch completes during the quick poll", async () => {
    const provider = {
      submitImageBatch: vi.fn().mockResolvedValue({
        batchId: "b1",
        status: "completed"
      }),
      getImageBatch: vi.fn(),
      downloadImageBatchResults: vi
        .fn()
        .mockResolvedValue([Uint8Array.from([1, 2])])
    };

    const images = await awaitImageBatchOrSuspend({
      provider,
      providerId: "openai",
      nodeId: "n1",
      params: { model: "gpt-image-2", requests: [{ prompt: "hi" }] },
      quickPollMs: 0
    });

    expect(images[0]).toEqual(Uint8Array.from([1, 2]));
    expect(provider.getImageBatch).not.toHaveBeenCalled();
  });

  it("suspends with durable batch state when still pending", async () => {
    const provider = {
      submitImageBatch: vi.fn().mockResolvedValue({
        batchId: "batch_slow",
        status: "in_progress"
      }),
      getImageBatch: vi.fn().mockResolvedValue({
        batchId: "batch_slow",
        status: "in_progress"
      }),
      downloadImageBatchResults: vi.fn()
    };

    try {
      await awaitImageBatchOrSuspend({
        provider,
        providerId: "gemini",
        nodeId: "node-9",
        params: {
          model: "gemini-3.1-flash-image",
          requests: [{ prompt: "hi" }]
        },
        quickPollMs: 0
      });
      expect.fail("expected WorkflowSuspendedError");
    } catch (err) {
      expect(err).toBeInstanceOf(WorkflowSuspendedError);
      const suspended = err as WorkflowSuspendedError;
      expect(suspended.nodeId).toBe("node-9");
      expect(suspended.reason).toBe(IMAGE_BATCH_SUSPEND_REASON);
      expect(suspended.state).toMatchObject({
        kind: IMAGE_BATCH_KIND,
        provider: "gemini",
        batchId: "batch_slow",
        model: "gemini-3.1-flash-image"
      });
      expect(suspended.metadata.kind).toBe(IMAGE_BATCH_KIND);
    }
    expect(provider.downloadImageBatchResults).not.toHaveBeenCalled();
  });

  it("calls onSubmitted with the batch id before polling", async () => {
    const onSubmitted = vi.fn().mockResolvedValue(undefined);
    const provider = {
      submitImageBatch: vi.fn().mockResolvedValue({
        batchId: "batch_persist",
        status: "in_progress"
      }),
      getImageBatch: vi.fn().mockResolvedValue({
        batchId: "batch_persist",
        status: "in_progress"
      }),
      downloadImageBatchResults: vi.fn()
    };

    await expect(
      awaitImageBatchOrSuspend({
        provider,
        providerId: "openai",
        nodeId: "n-persist",
        params: { model: "gpt-image-2", requests: [{ prompt: "hi" }] },
        quickPollMs: 0,
        onSubmitted
      })
    ).rejects.toBeInstanceOf(WorkflowSuspendedError);

    expect(onSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: IMAGE_BATCH_KIND,
        provider: "openai",
        batchId: "batch_persist",
        model: "gpt-image-2",
        nodeId: "n-persist"
      })
    );
  });
});

describe("openai.image.CreateImage use_batch", () => {
  beforeEach(() => {
    process.env.NODETOOL_IMAGE_BATCH_QUICK_POLL_MS = "0";
    openaiMocks.submitImageBatch.mockReset();
    openaiMocks.getImageBatch.mockReset();
    openaiMocks.downloadImageBatchResults.mockReset();
  });

  afterEach(() => {
    delete process.env.NODETOOL_IMAGE_BATCH_QUICK_POLL_MS;
  });

  it("suspends when Batch does not finish quickly", async () => {
    openaiMocks.submitImageBatch.mockResolvedValue({
      batchId: "batch_abc",
      status: "validating"
    });
    openaiMocks.getImageBatch.mockResolvedValue({
      batchId: "batch_abc",
      status: "in_progress"
    });

    const node = new CreateImageNode();
    node.__node_id = "create-1";
    node.setDynamic("_secrets", { OPENAI_API_KEY: "sk-test" });
    node.prompt = "a fox";
    node.model = "gpt-image-2";
    node.size = "1024x1024";
    node.quality = "medium";
    node.use_batch = true;

    await expect(node.process()).rejects.toBeInstanceOf(WorkflowSuspendedError);
    expect(openaiMocks.submitImageBatch).toHaveBeenCalledWith({
      model: "gpt-image-2",
      requests: [{ prompt: "a fox", size: "1024x1024", quality: "medium" }]
    });
  });
});

describe("openai.image.EditImage use_batch", () => {
  beforeEach(() => {
    process.env.NODETOOL_IMAGE_BATCH_QUICK_POLL_MS = "0";
    openaiMocks.submitImageBatch.mockReset();
    openaiMocks.getImageBatch.mockReset();
    openaiMocks.downloadImageBatchResults.mockReset();
  });

  afterEach(() => {
    delete process.env.NODETOOL_IMAGE_BATCH_QUICK_POLL_MS;
  });

  it("includes reference image bytes when submitting Batch", async () => {
    openaiMocks.submitImageBatch.mockResolvedValue({
      batchId: "batch_edit",
      status: "completed"
    });
    openaiMocks.downloadImageBatchResults.mockResolvedValue([
      Uint8Array.from([9, 9])
    ]);

    const node = new EditImageNode();
    node.__node_id = "edit-1";
    node.setDynamic("_secrets", { OPENAI_API_KEY: "sk-test" });
    node.prompt = "make it blue";
    node.model = "gpt-image-2";
    node.size = "1024x1024";
    node.quality = "high";
    node.use_batch = true;
    node.image = {
      type: "image",
      data: Buffer.from([10, 20, 30]).toString("base64")
    };

    const result = await node.process();
    expect(result.output).toMatchObject({ type: "image" });
    expect(openaiMocks.submitImageBatch).toHaveBeenCalledOnce();
    const arg = openaiMocks.submitImageBatch.mock.calls[0][0];
    expect(arg.model).toBe("gpt-image-2");
    expect(arg.requests[0].prompt).toBe("make it blue");
    expect(arg.requests[0].images[0]).toEqual(Uint8Array.from([10, 20, 30]));
  });
});

describe("gemini.image.ImageGeneration use_batch", () => {
  beforeEach(() => {
    process.env.NODETOOL_IMAGE_BATCH_QUICK_POLL_MS = "0";
    geminiMocks.submitImageBatch.mockReset();
    geminiMocks.getImageBatch.mockReset();
    geminiMocks.downloadImageBatchResults.mockReset();
  });

  afterEach(() => {
    delete process.env.NODETOOL_IMAGE_BATCH_QUICK_POLL_MS;
  });

  it("suspends a pending Gemini Batch with multi-image refs", async () => {
    geminiMocks.submitImageBatch.mockResolvedValue({
      batchId: "g-batch",
      status: "in_progress"
    });
    geminiMocks.getImageBatch.mockResolvedValue({
      batchId: "g-batch",
      status: "in_progress"
    });

    const node = new ImageGenerationNode();
    node.__node_id = "gem-1";
    node.setDynamic("_secrets", { GEMINI_API_KEY: "g-test" });
    node.prompt = "a bird";
    node.model = "gemini-3.1-flash-image";
    node.aspect_ratio = "1:1";
    node.resolution = "1K";
    node.use_batch = true;
    node.image = [
      {
        type: "image",
        data: Buffer.from([7, 8]).toString("base64")
      },
      {
        type: "image",
        data: Buffer.from([9]).toString("base64")
      }
    ];

    try {
      await node.process();
      expect.fail("expected suspend");
    } catch (err) {
      expect(err).toBeInstanceOf(WorkflowSuspendedError);
    }
    const arg = geminiMocks.submitImageBatch.mock.calls[0][0];
    expect(arg.requests[0]).toMatchObject({
      prompt: "a bird",
      aspectRatio: "1:1",
      resolution: "1K"
    });
    expect(arg.requests[0].images).toEqual([
      Uint8Array.from([7, 8]),
      Uint8Array.from([9])
    ]);
  });

  it("rejects Batch for imagen models", async () => {
    const node = new ImageGenerationNode();
    node.setDynamic("_secrets", { GEMINI_API_KEY: "g-test" });
    node.prompt = "a bird";
    node.model = "imagen-4.0-generate-001";
    node.use_batch = true;
    await expect(node.process()).rejects.toThrow(/gemini-\*/);
  });
});
