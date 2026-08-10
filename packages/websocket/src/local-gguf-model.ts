/**
 * Helpers for GGUFs discovered on disk (node_llama_cpp / llama.cpp cache and
 * HuggingFace hub snapshots). Absolute Windows/Unix paths must never be sent
 * to the Hub as a repo id.
 */

import * as fsp from "node:fs/promises";

export function isFilesystemPath(value: string): boolean {
  return (
    value.startsWith("/") ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    value.startsWith("\\\\")
  );
}

/**
 * Parse `…/models--org--repo/snapshots/<rev>/file.gguf` into Hub coordinates.
 */
export function parseHfHubGgufCachePath(absolutePath: string): {
  repoId: string;
  filename: string;
} | null {
  const normalized = absolutePath.replace(/\\/g, "/");
  const match = normalized.match(
    /\/models--([^/]+)\/snapshots\/[^/]+\/([^/]+\.gguf)$/i
  );
  if (!match) {
    return null;
  }
  return {
    repoId: match[1].split("--").join("/"),
    filename: match[2]
  };
}

export function isLocalInferenceProvider(provider: string): boolean {
  return (
    provider === "ollama" ||
    provider === "llama_cpp" ||
    provider === "node_llama_cpp" ||
    provider === "mlx"
  );
}

export interface LocalGgufUnifiedFields {
  repo_id: string | null;
  path: string | null;
  cache_path: string | null;
  downloaded: boolean;
  size_on_disk: number | null;
}

/** Fields to overlay on UnifiedModel for a local language/embedding GGUF. */
export async function localGgufUnifiedFields(model: {
  id: string;
  provider: string;
  path?: string | null;
}): Promise<LocalGgufUnifiedFields> {
  const downloaded = isLocalInferenceProvider(model.provider);
  if (!isFilesystemPath(model.id)) {
    return {
      repo_id: null,
      path: model.path ?? null,
      cache_path: null,
      downloaded,
      size_on_disk: null
    };
  }

  const size_on_disk = await fileSizeBytes(model.id);
  const parsed = parseHfHubGgufCachePath(model.id);
  if (parsed) {
    return {
      repo_id: parsed.repoId,
      path: parsed.filename,
      cache_path: model.id,
      downloaded: true,
      size_on_disk
    };
  }

  const slash = Math.max(model.id.lastIndexOf("/"), model.id.lastIndexOf("\\"));
  const filename = slash >= 0 ? model.id.slice(slash + 1) : model.id;
  return {
    repo_id: null,
    path: filename.toLowerCase().endsWith(".gguf")
      ? filename
      : (model.path ?? null),
    cache_path: model.id,
    downloaded: true,
    size_on_disk
  };
}

async function fileSizeBytes(absolutePath: string): Promise<number | null> {
  try {
    // `stat` follows symlinks so hub snapshot links report the blob size.
    const stat = await fsp.stat(absolutePath);
    return stat.size;
  } catch {
    return null;
  }
}
