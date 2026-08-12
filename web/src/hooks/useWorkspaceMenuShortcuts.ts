import { useCallback, useEffect } from "react";

import { useMenuHandler } from "./useIpcRenderer";
import type { MenuEventData } from "../window";
import { useWorkspaceTabsStore } from "../stores/WorkspaceTabsStore";
import { useWorkflowManager } from "../contexts/WorkflowManagerContext";
import { registerComboCallback } from "../stores/KeyPressedStore";
import { NODE_EDITOR_SHORTCUTS } from "../config/shortcuts";
import { isMac } from "../utils/platform";
import {
  resolveAdjacentTabId,
  resolveTabIdAtIndex
} from "./workspaceTabSwitch";

const ControlOrMeta = isMac() ? "Meta" : "Control";

const TAB_SWITCH_SLUGS = new Set([
  "prevTab",
  "nextTab",
  ...Array.from({ length: 9 }, (_, i) => `switchToTab${i + 1}`)
]);

const mapComboForOS = (combo: string[]): string[] =>
  combo.map((key) => (key === "Control" ? ControlOrMeta : key));

/**
 * Workspace-level tab shortcuts and Electron menu tab actions.
 *
 * "Close Tab" (Cmd+W) used to live only in the node editor, so it only worked
 * while a workflow tab was focused. Prev/next and Ctrl+1–9 had the same gap,
 * and they also navigated through `/editor/:id` (redirect hop → black flash).
 * Handling them here — where the shell is always mounted — switches via
 * `setActiveTab` for every surface, mirroring the tab bar.
 */
export function useWorkspaceMenuShortcuts(): void {
  const closeTab = useWorkspaceTabsStore((state) => state.closeTab);
  const removeWorkflow = useWorkflowManager((state) => state.removeWorkflow);

  const switchTab = useCallback((direction: "prev" | "next") => {
    const { tabs, activeTabId, setActiveTab } =
      useWorkspaceTabsStore.getState();
    const nextId = resolveAdjacentTabId(tabs, activeTabId, direction);
    if (nextId) {
      setActiveTab(nextId);
    }
  }, []);

  const switchToTab = useCallback((index: number) => {
    const { tabs, setActiveTab } = useWorkspaceTabsStore.getState();
    const id = resolveTabIdAtIndex(tabs, index);
    if (id) {
      setActiveTab(id);
    }
  }, []);

  const handleMenuEvent = useCallback(
    (data: MenuEventData) => {
      if (data.type === "close" || data.type === "closeTab") {
        const { activeTabId, tabs } = useWorkspaceTabsStore.getState();
        const tab = tabs.find((t) => t.id === activeTabId);
        if (!tab) {
          return;
        }
        closeTab(tab.id);
        if (tab.type === "workflow") {
          removeWorkflow(tab.ref);
        }
        return;
      }
      if (data.type === "prevTab") {
        switchTab("prev");
        return;
      }
      if (data.type === "nextTab") {
        switchTab("next");
        return;
      }
      if (data.type === "switchToTab" && data.index !== undefined) {
        switchToTab(data.index);
      }
    },
    [closeTab, removeWorkflow, switchTab, switchToTab]
  );

  useMenuHandler(handleMenuEvent);

  useEffect(() => {
    const disposers: Array<() => void> = [];

    for (const sc of NODE_EDITOR_SHORTCUTS) {
      if (!TAB_SWITCH_SLUGS.has(sc.slug) || !sc.registerCombo) {
        continue;
      }

      let callback: () => void;
      if (sc.slug === "prevTab") {
        callback = () => switchTab("prev");
      } else if (sc.slug === "nextTab") {
        callback = () => switchTab("next");
      } else {
        const match = /^switchToTab(\d+)$/.exec(sc.slug);
        if (!match) {
          continue;
        }
        const index = Number(match[1]) - 1;
        callback = () => switchToTab(index);
      }

      const combos = [sc.keyCombo, ...(sc.altKeyCombos ?? [])];
      for (const cmb of combos) {
        const normalized = mapComboForOS(cmb)
          .map((k) => k.toLowerCase())
          .sort()
          .join("+");
        disposers.push(
          registerComboCallback(normalized, {
            callback,
            preventDefault: true,
            active: true
          })
        );
      }
    }

    return () => {
      disposers.forEach((dispose) => dispose());
    };
  }, [switchTab, switchToTab]);
}
