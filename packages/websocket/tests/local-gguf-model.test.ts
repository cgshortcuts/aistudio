import { describe, it, expect } from "vitest";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  isFilesystemPath,
  parseHfHubGgufCachePath,
  localGgufUnifiedFields
} from "../src/local-gguf-model.js";

describe("isFilesystemPath", () => {
  it("detects unix and windows absolute paths", () => {
    expect(isFilesystemPath("/home/dave/model.gguf")).toBe(true);
    expect(
      isFilesystemPath(
        "C:\\Users\\Dave\\.cache\\huggingface\\hub\\models--Qwen--Qwen3-32B-GGUF\\snapshots\\abc\\Qwen3-32B-Q4_K_M.gguf"
      )
    ).toBe(true);
    expect(isFilesystemPath("Qwen/Qwen3-32B-GGUF")).toBe(false);
  });
});

describe("parseHfHubGgufCachePath", () => {
  it("parses a Windows hub snapshot path", () => {
    const parsed = parseHfHubGgufCachePath(
      "C:\\Users\\Dave\\.cache\\huggingface\\hub\\models--Qwen--Qwen3-32B-GGUF\\snapshots\\99caa2c657b2d35e922d903773e5ca3892c3b248\\Qwen3-32B-Q4_K_M.gguf"
    );
    expect(parsed).toEqual({
      repoId: "Qwen/Qwen3-32B-GGUF",
      filename: "Qwen3-32B-Q4_K_M.gguf"
    });
  });

  it("parses a unix hub snapshot path", () => {
    const parsed = parseHfHubGgufCachePath(
      "/home/dave/.cache/huggingface/hub/models--ggml-org--gemma-3-4b-it-GGUF/snapshots/abc/gemma.gguf"
    );
    expect(parsed).toEqual({
      repoId: "ggml-org/gemma-3-4b-it-GGUF",
      filename: "gemma.gguf"
    });
  });

  it("returns null for non-hub paths", () => {
    expect(parseHfHubGgufCachePath("/tmp/flat.gguf")).toBeNull();
  });
});

describe("localGgufUnifiedFields", () => {
  it("marks node_llama_cpp hub files as downloaded with Hub coordinates and size", async () => {
    const hubDir = await mkdtemp(join(tmpdir(), "nlc-size-"));
    try {
      const snapshot = join(
        hubDir,
        "models--Qwen--Qwen3-32B-GGUF",
        "snapshots",
        "abc"
      );
      await mkdir(snapshot, { recursive: true });
      const gguf = join(snapshot, "Qwen3-32B-Q4_K_M.gguf");
      await writeFile(gguf, "x".repeat(2048));

      const fields = await localGgufUnifiedFields({
        id: gguf,
        provider: "node_llama_cpp"
      });
      expect(fields).toMatchObject({
        repo_id: "Qwen/Qwen3-32B-GGUF",
        path: "Qwen3-32B-Q4_K_M.gguf",
        cache_path: gguf,
        downloaded: true,
        size_on_disk: 2048
      });
    } finally {
      await rm(hubDir, { recursive: true, force: true });
    }
  });

  it("does not invent repo_id for bare filenames", async () => {
    await expect(
      localGgufUnifiedFields({
        id: "model-a.gguf",
        provider: "node_llama_cpp"
      })
    ).resolves.toEqual({
      repo_id: null,
      path: null,
      cache_path: null,
      downloaded: true,
      size_on_disk: null
    });
  });
});
