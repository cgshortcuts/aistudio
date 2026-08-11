import { useEffect, type RefObject } from "react";

import { scrollTabStripOnWheel } from "./scrollTabStripOnWheel";

/**
 * Vertical wheel scrolls the tab strip sideways. Middle-click mousedown is
 * cancelled so Chromium does not start autoscroll on the overflow container
 * (that would steal the auxclick that closes the tab).
 */
export function useWorkspaceTabStrip(
  ref: RefObject<HTMLElement | null>,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const element = ref.current;
    if (!element) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (scrollTabStripOnWheel(element, event)) {
        event.preventDefault();
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 1) {
        event.preventDefault();
      }
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("mousedown", onMouseDown, true);
    return () => {
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("mousedown", onMouseDown, true);
    };
  }, [enabled, ref]);
}
