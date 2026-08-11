import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

/**
 * Stop Windows/browser menu-bar focus on Alt so Alt+drag can pan the canvas.
 */
export function usePreventAltMenuActivation(enabled = true): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Alt" || event.repeat || isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);
}
