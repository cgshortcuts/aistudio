import {
  imageBatchPollIntervalMs,
  isImageBatchJob,
  isImageBatchPreviewValue,
  IMAGE_BATCH_FAST_POLL_MS,
  IMAGE_BATCH_SLOW_POLL_MS
} from "../imageBatch";
import type { Job } from "../../stores/ApiTypes";

const job = (over: Partial<Job>): Job =>
  ({
    id: "j1",
    user_id: "u",
    job_type: "workflow",
    workflow_id: "wf",
    status: "suspended",
    ...over
  }) as Job;

describe("isImageBatchPreviewValue", () => {
  it("detects the suspend payload", () => {
    expect(
      isImageBatchPreviewValue({ kind: "image_batch", batchId: "b" })
    ).toBe(true);
    expect(isImageBatchPreviewValue({ type: "image", uri: "x" })).toBe(false);
  });
});

describe("isImageBatchJob", () => {
  it("reads suspension_metadata.kind", () => {
    expect(
      isImageBatchJob(
        job({
          suspension_metadata: { kind: "image_batch", batchId: "b" }
        })
      )
    ).toBe(true);
  });

  it("rejects ordinary jobs", () => {
    expect(isImageBatchJob(job({ status: "running" }))).toBe(false);
  });
});

describe("imageBatchPollIntervalMs", () => {
  it("uses the fast interval while the job is younger than 5 minutes", () => {
    const now = Date.parse("2026-01-01T00:04:00.000Z");
    expect(
      imageBatchPollIntervalMs(
        [
          job({
            started_at: "2026-01-01T00:00:00.000Z",
            suspension_metadata: {
              kind: "image_batch",
              submittedAt: "2026-01-01T00:00:00.000Z"
            }
          })
        ],
        now
      )
    ).toBe(IMAGE_BATCH_FAST_POLL_MS);
  });

  it("uses the slow interval after 5 minutes", () => {
    const now = Date.parse("2026-01-01T00:06:00.000Z");
    expect(
      imageBatchPollIntervalMs(
        [
          job({
            started_at: "2026-01-01T00:00:00.000Z",
            suspension_metadata: {
              kind: "image_batch",
              submittedAt: "2026-01-01T00:00:00.000Z"
            }
          })
        ],
        now
      )
    ).toBe(IMAGE_BATCH_SLOW_POLL_MS);
  });
});
