/**
 * Find Python package_metadata roots via `pip show`.
 *
 * Desktop startup used to call `python -m pip list` with no timeout. On
 * Windows that can hang on the Microsoft Store `python.exe` alias, or take
 * tens of seconds on a cold Conda install — all before Fastify binds a port.
 *
 * This helper:
 * - prefers `NODETOOL_PYTHON` (the desktop app already sets this)
 * - skips Windows Store aliases
 * - kills the scan after {@link PIP_METADATA_TIMEOUT_MS}
 *
 * An empty result is safe: TypeScript node packs still load, and Python nodes
 * merge in later when the worker bridge connects.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createLogger } from "@nodetool-ai/config";

const log = createLogger("nodetool.websocket.pip-metadata-roots");

/** Cap for the `python -c pip list/show` scan. */
export const PIP_METADATA_TIMEOUT_MS = 5_000;

const LOOKUP_TIMEOUT_MS = 2_000;

const PIP_METADATA_SCRIPT = `
import json, pathlib, subprocess, sys
roots = set()
try:
    # Discover all nodetool-* packages
    list_proc = subprocess.run(
        [sys.executable, "-m", "pip", "list", "--format=json"],
        capture_output=True, text=True, check=False,
    )
    pkg_names = [
        p["name"] for p in json.loads(list_proc.stdout or "[]")
        if p["name"].startswith("nodetool-")
    ] or ["nodetool-core", "nodetool-base"]
    proc = subprocess.run(
        [sys.executable, "-m", "pip", "show", "-f"] + pkg_names,
        capture_output=True, text=True, check=False,
    )
    output = proc.stdout or ""
except Exception:
    output = ""
location = None
in_files = False
for raw in output.splitlines():
    line = raw.rstrip("\\n")
    if line.startswith("Name: "):
        location = None; in_files = False; continue
    if line.startswith("Location: "):
        location = line.split(":", 1)[1].strip(); continue
    if line.startswith("Editable project location: "):
        editable = line.split(":", 1)[1].strip()
        if editable: roots.add(editable)
        continue
    if line.startswith("Files:"): in_files = True; continue
    if line.startswith("---"):
        location = None; in_files = False; continue
    if not in_files or not location or not line.startswith("  "): continue
    rel = line.strip().replace("\\\\", "/")
    if "package_metadata" not in rel: continue
    abs_path = (pathlib.Path(location) / rel).resolve()
    metadata_dir = abs_path if abs_path.is_dir() else abs_path.parent
    roots.add(str(metadata_dir))
print(json.dumps(sorted(roots)))
`;

export interface SpawnSyncResult {
  status: number | null;
  stdout?: string | null;
  error?: NodeJS.ErrnoException;
}

export interface SpawnSyncLike {
  (
    command: string,
    args: readonly string[],
    options: {
      encoding: "utf8";
      timeout: number;
      windowsHide: boolean;
      stdio?: ["ignore", "pipe", "ignore"];
    }
  ): SpawnSyncResult;
}

export interface DetectPipMetadataRootsOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  spawnSync?: SpawnSyncLike;
  existsSync?: (path: string) => boolean;
  timeoutMs?: number;
}

export function isWindowsStorePythonAlias(
  executable: string,
  platform: NodeJS.Platform = process.platform
): boolean {
  if (platform !== "win32") return false;
  const normalized = executable.replace(/\//g, "\\").toLowerCase();
  return normalized.includes("\\microsoft\\windowsapps\\");
}

function looksLikePath(command: string): boolean {
  return command.includes("/") || command.includes("\\") || /^[A-Za-z]:/.test(command);
}

function resolveCommand(
  command: string,
  options: {
    platform: NodeJS.Platform;
    spawn: SpawnSyncLike;
    exists: (path: string) => boolean;
  }
): string | null {
  if (looksLikePath(command)) {
    return options.exists(command) ? command : null;
  }

  const finder = options.platform === "win32" ? "where" : "which";
  const lookup = options.spawn(finder, [command], {
    encoding: "utf8",
    timeout: LOOKUP_TIMEOUT_MS,
    windowsHide: true
  });
  if (lookup.status !== 0 || lookup.error) return null;

  const text = lookup.stdout ?? "";
  for (const line of text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)) {
    if (isWindowsStorePythonAlias(line, options.platform)) continue;
    if (options.exists(line) || !looksLikePath(line)) return line;
  }
  return null;
}

function pythonCandidates(env: NodeJS.ProcessEnv): string[] {
  const fromEnv = env["NODETOOL_PYTHON"]?.trim();
  const candidates: string[] = [];
  if (fromEnv) candidates.push(fromEnv);
  for (const name of ["python3", "python"]) {
    if (!candidates.includes(name)) candidates.push(name);
  }
  return candidates;
}

/**
 * Scan installed `nodetool-*` Python packages for `package_metadata` dirs.
 * Never throws; returns `[]` when Python is missing, aliased, or too slow.
 */
export function detectPipMetadataRoots(
  options: DetectPipMetadataRootsOptions = {}
): string[] {
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const spawn = options.spawnSync ?? (spawnSync as SpawnSyncLike);
  const exists = options.existsSync ?? existsSync;
  const timeoutMs = options.timeoutMs ?? PIP_METADATA_TIMEOUT_MS;

  for (const candidate of pythonCandidates(env)) {
    if (isWindowsStorePythonAlias(candidate, platform)) {
      log.warn("Skipped Windows Store Python alias", { executable: candidate });
      continue;
    }

    const executable = resolveCommand(candidate, { platform, spawn, exists });
    if (!executable) continue;
    if (isWindowsStorePythonAlias(executable, platform)) {
      log.warn("Skipped Windows Store Python alias", { executable });
      continue;
    }

    const proc = spawn(executable, ["-c", PIP_METADATA_SCRIPT], {
      encoding: "utf8",
      timeout: timeoutMs,
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"]
    });

    if (proc.error?.code === "ETIMEDOUT") {
      log.warn("Python metadata scan timed out", {
        executable,
        timeoutMs
      });
      continue;
    }
    if (proc.status !== 0 || !proc.stdout) continue;

    try {
      const roots = JSON.parse(String(proc.stdout).trim()) as unknown;
      if (!Array.isArray(roots)) continue;
      return roots.filter(
        (p): p is string => typeof p === "string" && p.length > 0 && exists(p)
      );
    } catch {
      // try next interpreter
    }
  }

  return [];
}
