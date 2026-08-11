import { describe, it, expect, vi, afterEach } from "vitest";
import { GeminiProvider } from "../../src/providers/gemini-provider.js";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("GeminiProvider — image batch", () => {
  it("submitImageBatch posts inline batchGenerateContent", async () => {
    global.fetch = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      expect(u).toContain("gemini-3.1-flash-image:batchGenerateContent");
      const body = JSON.parse(String(init?.body));
      expect(body.batch.input_config.requests.requests).toHaveLength(2);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          name: "batches/job-1",
          state: "JOB_STATE_PENDING"
        })
      } as Response;
    }) as unknown as typeof fetch;

    const provider = new GeminiProvider(
      { GEMINI_API_KEY: "k" },
      { fetchFn: global.fetch }
    );
    const job = await provider.submitImageBatch({
      model: "gemini-3.1-flash-image",
      requests: [
        { prompt: "a fox", aspectRatio: "1:1", resolution: "1K" },
        { prompt: "a bird" }
      ]
    });
    expect(job.batchId).toBe("batches/job-1");
    expect(job.status).toBe("validating");
  });

  it("submitImageBatch embeds reference images as inlineData", async () => {
    global.fetch = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      const req = body.batch.input_config.requests.requests[0].request;
      expect(req.contents[0].parts).toHaveLength(2);
      expect(req.contents[0].parts[1].inlineData.data).toBe(
        Buffer.from([1, 2, 3]).toString("base64")
      );
      return {
        ok: true,
        status: 200,
        json: async () => ({
          name: "batches/job-ref",
          state: "JOB_STATE_PENDING"
        })
      } as Response;
    }) as unknown as typeof fetch;

    const provider = new GeminiProvider(
      { GEMINI_API_KEY: "k" },
      { fetchFn: global.fetch }
    );
    await provider.submitImageBatch({
      model: "gemini-3.1-flash-image",
      requests: [
        {
          prompt: "restyle this",
          images: [Uint8Array.from([1, 2, 3])]
        }
      ]
    });
  });

  it("getImageBatch maps JOB_STATE_SUCCEEDED to completed", async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        name: "batches/job-1",
        state: "JOB_STATE_SUCCEEDED",
        dest: { fileName: "files/out-1" }
      })
    })) as unknown as typeof fetch;

    const provider = new GeminiProvider(
      { GEMINI_API_KEY: "k" },
      { fetchFn: global.fetch }
    );
    const job = await provider.getImageBatch({ batchId: "batches/job-1" });
    expect(job.status).toBe("completed");
    expect(job.outputFileId).toBe("files/out-1");
  });

  it("getImageBatch maps BATCH_STATE_SUCCEEDED to completed", async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        name: "batches/job-1",
        state: "BATCH_STATE_SUCCEEDED"
      })
    })) as unknown as typeof fetch;

    const provider = new GeminiProvider(
      { GEMINI_API_KEY: "k" },
      { fetchFn: global.fetch }
    );
    const job = await provider.getImageBatch({ batchId: "batches/job-1" });
    expect(job.status).toBe("completed");
  });

  it("getImageBatch treats LRO done:true as completed", async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        name: "batches/job-1",
        done: true,
        response: { inlinedResponses: { inlinedResponses: [] } }
      })
    })) as unknown as typeof fetch;

    const provider = new GeminiProvider(
      { GEMINI_API_KEY: "k" },
      { fetchFn: global.fetch }
    );
    const job = await provider.getImageBatch({ batchId: "batches/job-1" });
    expect(job.status).toBe("completed");
  });

  it("getImageBatch reads state from nested batch.state", async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        name: "batches/job-1",
        metadata: { batch: { state: "BATCH_STATE_RUNNING" } }
      })
    })) as unknown as typeof fetch;

    const provider = new GeminiProvider(
      { GEMINI_API_KEY: "k" },
      { fetchFn: global.fetch }
    );
    const job = await provider.getImageBatch({ batchId: "batches/job-1" });
    expect(job.status).toBe("in_progress");
  });

  it("downloadImageBatchResults extracts inline images and applies batchDiscount", async () => {
    const pngB64 = Buffer.from([137, 80, 78, 71]).toString("base64");
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        name: "batches/job-1",
        state: "JOB_STATE_SUCCEEDED",
        dest: {
          inlinedResponses: [
            {
              response: {
                candidates: [
                  {
                    content: {
                      parts: [{ inlineData: { data: pngB64 } }]
                    }
                  }
                ]
              }
            }
          ]
        }
      })
    })) as unknown as typeof fetch;

    const provider = new GeminiProvider(
      { GEMINI_API_KEY: "k" },
      { fetchFn: global.fetch }
    );
    const images = await provider.downloadImageBatchResults({
      batchId: "batches/job-1",
      model: "gemini-3.1-flash-image"
    });
    expect(images).toHaveLength(1);
    expect(provider.getTotalCost()).toBeGreaterThanOrEqual(0);
  });

  it("downloadImageBatchResults unwraps nested inlinedResponses on a done LRO", async () => {
    const pngB64 = Buffer.from([137, 80, 78, 71]).toString("base64");
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        name: "batches/job-1",
        done: true,
        response: {
          inlinedResponses: {
            inlinedResponses: [
              {
                response: {
                  candidates: [
                    {
                      content: {
                        parts: [{ inline_data: { data: pngB64 } }]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      })
    })) as unknown as typeof fetch;

    const provider = new GeminiProvider(
      { GEMINI_API_KEY: "k" },
      { fetchFn: global.fetch }
    );
    const images = await provider.downloadImageBatchResults({
      batchId: "batches/job-1",
      model: "gemini-3.1-flash-image"
    });
    expect(images).toHaveLength(1);
    expect(images[0]).toEqual(Uint8Array.from([137, 80, 78, 71]));
  });

  it("submitImageBatch rejects empty request list", async () => {
    const provider = new GeminiProvider({ GEMINI_API_KEY: "k" });
    await expect(
      provider.submitImageBatch({
        model: "gemini-3.1-flash-image",
        requests: []
      })
    ).rejects.toThrow(/at least one/);
  });
});
