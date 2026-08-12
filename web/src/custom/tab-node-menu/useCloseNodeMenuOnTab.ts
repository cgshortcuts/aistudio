import { useEffect } from "react";

/**
 * Close the node menu on Tab, including while its search field is focused.
 * Canvas Tab is suppressed in inputs, so the editor shortcut cannot toggle
 * the menu closed from search. Ctrl/Alt/Meta+Tab are left for other shortcuts.
 */
export function useCloseNodeMenuOnTab(
  isMenuOpen: boolean,
  closeNodeMenu: () => void
): void {
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "Tab" ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
      ) {
        return;
      }
      event.preventDefault();
      closeNodeMenu();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen, closeNodeMenu]);
}
