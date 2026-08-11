import { useContext, useEffect, useRef } from "react";

import { KeyboardContext } from "../../components/KeyboardProvider";
import { useKeyPressedStore } from "../../stores/KeyPressedStore";
import { isEditableElement } from "../../utils/browser";
import {
  matchRailDigitShortcut,
  type RailShortcutModifier
} from "./railMenuShortcuts";

export function useRailDigitShortcuts(
  modifier: RailShortcutModifier,
  actions: ReadonlyArray<() => void>
): void {
  const keyboardActive = useContext(KeyboardContext);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    if (!keyboardActive) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (useKeyPressedStore.getState().isPaused) {
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      if (
        isEditableElement(target) ||
        isEditableElement(document.activeElement)
      ) {
        return;
      }
      const index = matchRailDigitShortcut(event, modifier);
      if (index == null) {
        return;
      }
      const action = actionsRef.current[index];
      if (!action) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      action();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [keyboardActive, modifier]);
}
