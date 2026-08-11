import { describe, expect, it, vi } from "vitest";
import {
  PIP_METADATA_TIMEOUT_MS,
  detectPipMetadataRoots,
  isWindowsStorePythonAlias,
  type SpawnSyncLike
} from "../src/lib/pip-metadata-roots.js";

const STORE_PYTHON =
  "C:\\Users\\dave\\AppData\\Local\\Microsoft\\WindowsApps\\python.exe";
const REAL_PYTHON = "C:\\Python312\\python.exe";
const CONDA_PYTHON = "C:\\ProgramData\\nodetool\\conda_env\\python.exe";

describe("isWindowsStorePythonAlias", () => {
  it("detects WindowsApps python stubs", () => {
    expect(isWindowsStorePythonAlias(STORE_PYTHON, "win32")).toBe(true);
    expect(
      isWindowsStorePythonAlias(
        "C:/Users/dave/AppData/Local/Microsoft/WindowsApps/python3.exe",
        "win32"
      )
    ).toBe(true);
  });

  it("ignores real interpreters and non-Windows paths", () => {
    expect(isWindowsStorePythonAlias(REAL_PYTHON, "win32")).toBe(false);
    expect(isWindowsStorePythonAlias("/usr/bin/python3", "linux")).toBe(false);
    expect(isWindowsStorePythonAlias(STORE_PYTHON, "linux")).toBe(false);
  });
});

describe("detectPipMetadataRoots", () => {
  it("prefers NODETOOL_PYTHON and returns existing roots", () => {
    const spawn = vi.fn<SpawnSyncLike>((command, args) => {
      if (command === CONDA_PYTHON && args[0] === "-c") {
        return { status: 0, stdout: '["C:\\\\meta\\\\nodetool-base"]' };
      }
      throw new Error(`unexpected spawn ${command} ${args.join(" ")}`);
    });
    const exists = vi.fn((path: string) => path === CONDA_PYTHON || path.includes("meta"));

    const roots = detectPipMetadataRoots({
      env: { NODETOOL_PYTHON: CONDA_PYTHON },
      platform: "win32",
      spawnSync: spawn,
      existsSync: exists
    });

    expect(roots).toEqual(["C:\\meta\\nodetool-base"]);
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn.mock.calls[0]?.[2].timeout).toBe(PIP_METADATA_TIMEOUT_MS);
  });

  it("uses a real python.exe when `where` lists the Store alias first", () => {
    const spawn = vi.fn<SpawnSyncLike>((command, args) => {
      if (command === "where") {
        return {
          status: 0,
          stdout: `${STORE_PYTHON}\r\n${REAL_PYTHON}\r\n`
        };
      }
      if (command === REAL_PYTHON && args[0] === "-c") {
        return { status: 0, stdout: '["D:\\\\meta"]' };
      }
      throw new Error(`unexpected spawn ${command}`);
    });

    const roots = detectPipMetadataRoots({
      env: {},
      platform: "win32",
      spawnSync: spawn,
      existsSync: () => true
    });

    expect(roots).toEqual(["D:\\meta"]);
    expect(spawn.mock.calls.some((call) => call[0] === REAL_PYTHON)).toBe(true);
  });

  it("does not run pip through a Windows Store python alias", () => {
    const spawn = vi.fn<SpawnSyncLike>((command, args) => {
      if (command === "where") {
        const name = args[0];
        if (name === "python3" || name === "python") {
          return { status: 0, stdout: `${STORE_PYTHON}\n` };
        }
      }
      throw new Error(`unexpected spawn ${command}`);
    });

    const roots = detectPipMetadataRoots({
      env: {},
      platform: "win32",
      spawnSync: spawn,
      existsSync: () => true
    });

    expect(roots).toEqual([]);
    expect(spawn.mock.calls.every((call) => call[0] === "where")).toBe(true);
  });

  it("skips a timed-out interpreter and tries the next", () => {
    const spawn = vi.fn<SpawnSyncLike>((command, args) => {
      if (command === "which" && args[0] === "python3") {
        return { status: 0, stdout: "/usr/bin/python3\n" };
      }
      if (command === "/usr/bin/python3") {
        return {
          status: null,
          stdout: "",
          error: Object.assign(new Error("timed out"), { code: "ETIMEDOUT" })
        };
      }
      if (command === "which" && args[0] === "python") {
        return { status: 0, stdout: "/usr/bin/python\n" };
      }
      if (command === "/usr/bin/python") {
        return { status: 0, stdout: '["/opt/meta"]' };
      }
      throw new Error(`unexpected spawn ${command}`);
    });

    const roots = detectPipMetadataRoots({
      env: {},
      platform: "linux",
      spawnSync: spawn,
      existsSync: () => true
    });

    expect(roots).toEqual(["/opt/meta"]);
  });

  it("returns an empty list when no interpreter works", () => {
    const spawn = vi.fn<SpawnSyncLike>(() => ({
      status: 1,
      stdout: "",
      error: Object.assign(new Error("not found"), { code: "ENOENT" })
    }));

    expect(
      detectPipMetadataRoots({
        env: {},
        platform: "linux",
        spawnSync: spawn,
        existsSync: () => false
      })
    ).toEqual([]);
  });
});
