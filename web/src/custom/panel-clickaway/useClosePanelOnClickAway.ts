import { useEffect, type RefObject } from "react";

/**
 * Portaled overlays (menus, dialogs, popovers) render outside panel DOM
 * trees. Clicks inside them must not count as "away".
 */
const PORTAL_SELECTOR = [
  ".MuiModal-root",
  ".MuiPopover-root",
  ".MuiMenu-root"
].join(", ");

export interface ClosePanelOnClickAwayOptions {
  /** When false, the listener is inactive. */
  enabled: boolean;
  onClose: () => void;
}

/**
 * Call `onClose` when the user presses outside `containerRef`.
 */
export function useClosePanelOnClickAway(
  containerRef: RefObject<HTMLElement | null>,
  { enabled, onClose }: ClosePanelOnClickAwayOptions
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (container.contains(target)) {
        return;
      }

      if (target.closest(PORTAL_SELECTOR)) {
        return;
      }

      onClose();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [containerRef, enabled, onClose]);
}
