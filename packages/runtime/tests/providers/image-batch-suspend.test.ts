import { describe, it, expect } from "vitest";
import {
  IMAGE_BATCH_KIND,
  readImageBatchSuspendState
} from "../../src/providers/image-batch-suspend.js";

describe("readImageBatchSuspendState", () => {
  const state = {
    kind: IMAGE_BATCH_KIND,
    provider: "openai" as const,
    batchId: "batch_xyz",
    model: "gpt-image-2",
    submittedAt: "2026-01-01T00:00:00.000Z"
  };

  it("reads a full state object", () => {
    expect(readImageBatchSuspendState(state)).toEqual(state);
  });

  it("falls back to metadata when state is missing", () => {
    expect(readImageBatchSuspendState(null, state)).toEqual(state);
  });

  it("accepts optional nodeId", () => {
    expect(
      readImageBatchSuspendState({
        ...state,
        nodeId: "n1"
      })
    ).toMatchObject({ ...state, nodeId: "n1" });
  });

  it("rejects incomplete or wrong-kind payloads", () => {
    expect(readImageBatchSuspendState({ kind: "other" })).toBeNull();
    expect(
      readImageBatchSuspendState({
        kind: IMAGE_BATCH_KIND,
        provider: "openai",
        batchId: "",
        model: "x"
      })
    ).toBeNull();
    expect(readImageBatchSuspendState(undefined, undefined)).toBeNull();
  });
});
