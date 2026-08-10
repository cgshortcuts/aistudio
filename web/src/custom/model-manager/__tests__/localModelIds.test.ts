import {
  isFilesystemModelId,
  hubRepoIdForModel
} from "../localModelIds";

describe("localModelIds", () => {
  it("detects filesystem ids", () => {
    expect(
      isFilesystemModelId(
        "C:\\Users\\Dave\\.cache\\huggingface\\hub\\models--Qwen--x\\snapshots\\a\\f.gguf"
      )
    ).toBe(true);
    expect(isFilesystemModelId("Qwen/Qwen3-32B-GGUF")).toBe(false);
  });

  it("prefers repo_id and never returns a filesystem path", () => {
    expect(
      hubRepoIdForModel({
        id: "C:/Users/Dave/.cache/huggingface/hub/models--Qwen--Qwen3-32B-GGUF/snapshots/a/f.gguf",
        repo_id: "Qwen/Qwen3-32B-GGUF"
      })
    ).toBe("Qwen/Qwen3-32B-GGUF");

    expect(
      hubRepoIdForModel({
        id: "C:/Users/Dave/.cache/huggingface/hub/models--Qwen--Qwen3-32B-GGUF/snapshots/a/f.gguf",
        repo_id: null
      })
    ).toBeNull();
  });
});
