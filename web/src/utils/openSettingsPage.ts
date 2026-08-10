/**
 * Open Settings as a workspace page tab (keeps the left rail / app chrome).
 * Prefer this over `navigate("/settings")`, which mounts Settings on a bare
 * route without the workspace shell.
 */
import { navigateTo } from "../lib/appNavigation";
import { useWorkspaceTabsStore } from "../stores/WorkspaceTabsStore";
import { PAGE_TAB_TITLES } from "../components/workspace/pageTabs";

export interface OpenSettingsPageOptions {
  /** Settings tab index (0 General, 1 Models & Providers, …). Default 0. */
  tab?: number;
  /** Optional Models & Providers search query (`?q=`). */
  q?: string;
  /** Override navigation (tests / components with a router navigate). */
  navigate?: (to: string) => void;
}

export function openSettingsPage(options: OpenSettingsPageOptions = {}): void {
  const { tab = 0, q, navigate = navigateTo } = options;
  useWorkspaceTabsStore.getState().openTab({
    type: "page",
    ref: "settings",
    mode: "view",
    title: PAGE_TAB_TITLES.settings
  });
  const params = new URLSearchParams();
  if (tab !== 0) {
    params.set("tab", String(tab));
  }
  if (q) {
    params.set("q", q);
  }
  const qs = params.toString();
  navigate(qs ? `/workspace?${qs}` : "/workspace");
}
