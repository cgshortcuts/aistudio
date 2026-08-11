/**
 * RuntimePackagesStore
 *
 * Web-side wrapper around the Electron `window.api.packages` runtime IPC — the
 * "Software" half of the unified Package Manager (Python, FFmpeg, Node, pandoc,
 * yt-dlp, …, installed via conda/micromamba or npm in the desktop app).
 *
 * Runtime installation only exists in the Electron main process, so every
 * method degrades to a no-op when `window.api.packages` is absent (pure
 * browser / server mode). Components gate on `available` and show a
 * desktop-only notice instead.
 */
import { create } from "zustand";
import type { StoreApi } from "zustand";

import { formatErrorMessage } from "../utils/errorHandling";
import { trpcClient } from "../trpc/client";
// === CUSTOM FORK START: AiStudio Branding ===
import { APP_DISPLAY_NAME } from "../custom/branding";
// === CUSTOM FORK END ===

/** Display names for the runtimes the server reports (it sends bare ids). */
const SERVER_RUNTIME_LABELS: Record<string, string> = {
  python: "Python",
  nodejs: "Node.js",
  bash: "Bash",
  ruby: "Ruby",
  lua: "Lua",
  ffmpeg: "FFmpeg",
  ffprobe: "ffprobe",
  pandoc: "Pandoc",
  pdftotext: "PDF Tools (pdftotext)",
  pdftoppm: "PDF Tools (pdftoppm)",
  "yt-dlp": "yt-dlp",
  tmux: "tmux",
  claude: "Claude Code CLI"
};

interface RuntimePackageStatus {
  id: string;
  name: string;
  description: string;
  installed: boolean;
  installing: boolean;
}

const MAX_CONSOLE_LINES = 500;

interface RuntimePackagesStore {
  /** True when the Electron runtime IPC is reachable. */
  available: boolean;
  statuses: RuntimePackageStatus[];
  installLocation: string | null;
  /** Ids with an install/uninstall in flight (drives per-row spinners). */
  busyIds: string[];
  consoleLines: string[];
  isLoading: boolean;
  error: string | null;

  refresh: () => Promise<void>;
  install: (id: string) => Promise<boolean>;
  uninstall: (id: string) => Promise<boolean>;
  selectInstallLocation: () => Promise<void>;
  subscribeConsole: () => void;
  unsubscribeConsole: () => void;
  clearConsole: () => void;
}

/** Unsubscribe handle for the server-log stream; module-level so it survives
 * re-renders and never lands in serializable state. */
let logUnsubscribe: (() => void) | null = null;

const runtimeApi = () =>
  typeof window !== "undefined" ? window.api?.packages : undefined;

type SetState = StoreApi<RuntimePackagesStore>["setState"];
type GetState = StoreApi<RuntimePackagesStore>["getState"];

const DESKTOP_REQUIRED_MSG =
  `Software installs need the ${APP_DISPLAY_NAME} desktop app (not the browser). Use start-desktop.bat, then try Install again.`;

/** Human-readable size hint for long npm runtime installs. */
function installSizeHint(id: string): string {
  if (id === "node-llama-cpp") {
    return " On Windows/Linux this download is ~640 MB and can take several minutes.";
  }
  return "";
}

/**
 * Run an install/uninstall: flag the row busy, seed the console, run the op,
 * refresh statuses, then apply the outcome. The outcome is set *after* refresh
 * so a failure message survives (refresh clears `error`).
 */
async function runRuntimeOp(
  set: SetState,
  get: GetState,
  id: string,
  op: () => Promise<{ success: boolean; message: string }>,
  verb: "install" | "uninstall"
): Promise<boolean> {
  const startLine =
    verb === "install"
      ? `Starting install of ${id}…${installSizeHint(id)} Progress appears below.`
      : `Starting uninstall of ${id}…`;
  set((s) => ({
    busyIds: [...new Set([...s.busyIds, id])],
    error: null,
    consoleLines: [...s.consoleLines, startLine].slice(-MAX_CONSOLE_LINES)
  }));
  let success = false;
  let message = "";
  try {
    const res = await op();
    success = res.success;
    message = res.message;
  } catch (err: unknown) {
    message = formatErrorMessage(err, `Failed to ${verb} runtime`);
  }
  await get().refresh();
  const endLine = success
    ? message || `${id} ${verb} finished.`
    : message || `Failed to ${verb} ${id}.`;
  set((s) => ({
    busyIds: s.busyIds.filter((p) => p !== id),
    error: success ? null : message,
    consoleLines: [...s.consoleLines, endLine].slice(-MAX_CONSOLE_LINES)
  }));
  return success;
}

const useRuntimePackagesStore = create<RuntimePackagesStore>((set, get) => ({
  available:
    typeof window !== "undefined" && Boolean(window.api?.packages),
  statuses: [],
  installLocation: null,
  busyIds: [],
  consoleLines: [],
  isLoading: false,
  error: null,

  refresh: async () => {
    const api = runtimeApi();
    if (!api) {
      // No desktop IPC (browser / Docker deployment): the server can still say
      // what is on its PATH, so the list reports real status even though
      // installing from here isn't possible.
      set({ available: false, isLoading: true, error: null });
      try {
        const res = await trpcClient.packs.runtimeStatuses.query();
        set({
          statuses: res.statuses.map(({ id, installed }) => ({
            id,
            name: SERVER_RUNTIME_LABELS[id] ?? id,
            description: installed
              ? "Installed on the server."
              : "Not installed on the server.",
            installed,
            installing: false
          })),
          isLoading: false
        });
      } catch (err: unknown) {
        set({
          isLoading: false,
          error: formatErrorMessage(err, "Failed to load runtime packages")
        });
      }
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const [statuses, installLocation] = await Promise.all([
        api.getRuntimeStatuses(),
        api.getInstallLocation().catch(() => null)
      ]);
      set({ statuses, installLocation, isLoading: false, available: true });
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: formatErrorMessage(err, "Failed to load runtime packages")
      });
    }
  },

  install: async (id) => {
    const api = runtimeApi();
    if (!api?.installRuntime) {
      set({
        available: false,
        error: DESKTOP_REQUIRED_MSG,
        consoleLines: [
          ...get().consoleLines,
          DESKTOP_REQUIRED_MSG
        ].slice(-MAX_CONSOLE_LINES)
      });
      return false;
    }
    return runRuntimeOp(set, get, id, () => api.installRuntime(id), "install");
  },

  uninstall: async (id) => {
    const api = runtimeApi();
    if (!api?.uninstallRuntime) {
      set({
        available: false,
        error: DESKTOP_REQUIRED_MSG,
        consoleLines: [
          ...get().consoleLines,
          DESKTOP_REQUIRED_MSG
        ].slice(-MAX_CONSOLE_LINES)
      });
      return false;
    }
    return runRuntimeOp(
      set,
      get,
      id,
      () => api.uninstallRuntime!(id),
      "uninstall"
    );
  },

  selectInstallLocation: async () => {
    const api = runtimeApi();
    if (!api) return;
    try {
      const next = await api.selectInstallLocation();
      if (next) set({ installLocation: next });
    } catch (err: unknown) {
      set({
        error: formatErrorMessage(err, "Failed to set install location")
      });
    }
  },

  subscribeConsole: () => {
    const onLog =
      typeof window !== "undefined" ? window.api?.server?.onLog : undefined;
    if (!onLog || logUnsubscribe) return;
    logUnsubscribe = onLog((message: string) => {
      set((s) => ({
        consoleLines: [...s.consoleLines, message].slice(-MAX_CONSOLE_LINES)
      }));
    });
  },

  unsubscribeConsole: () => {
    logUnsubscribe?.();
    logUnsubscribe = null;
  },

  clearConsole: () => set({ consoleLines: [] })
}));

export default useRuntimePackagesStore;
