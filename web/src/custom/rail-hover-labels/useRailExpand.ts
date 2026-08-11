import { useCallback, useState, type FocusEvent, type MouseEvent } from "react";

function isLeaveInside(
  event: Pick<MouseEvent<HTMLElement>, "currentTarget" | "relatedTarget">
): boolean {
  const { currentTarget, relatedTarget } = event;
  return (
    relatedTarget instanceof Node && currentTarget.contains(relatedTarget)
  );
}

/**
 * Hover + keyboard-focus expand state for the left icon rail overlay.
 * Pointer leave collapses even if a rail control still has click-focus,
 * but not when the pointer only moved to a child.
 */
export function useRailExpand(): {
  railExpanded: boolean;
  railExpandHandlers: {
    onPointerEnter: () => void;
    onPointerLeave: (event: MouseEvent<HTMLDivElement>) => void;
    onMouseEnter: () => void;
    onMouseLeave: (event: MouseEvent<HTMLDivElement>) => void;
    onFocus: () => void;
    onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  };
} {
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const railExpanded = hovered || focusWithin;

  const expand = useCallback(() => {
    setHovered(true);
  }, []);

  const collapse = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (isLeaveInside(event)) {
      return;
    }
    setHovered(false);
    setFocusWithin(false);
  }, []);

  const onFocus = useCallback(() => {
    setFocusWithin(true);
  }, []);

  const onBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setFocusWithin(false);
  }, []);

  return {
    railExpanded,
    railExpandHandlers: {
      onPointerEnter: expand,
      onPointerLeave: collapse,
      onMouseEnter: expand,
      onMouseLeave: collapse,
      onFocus,
      onBlur
    }
  };
}
