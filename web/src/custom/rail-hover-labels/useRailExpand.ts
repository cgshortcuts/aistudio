import { useCallback, useState, type FocusEvent } from "react";

/**
 * Hover + focus-within expand state for the left icon rail overlay.
 * Collapses as soon as the pointer or focus leaves the rail.
 */
export function useRailExpand(): {
  railExpanded: boolean;
  railExpandHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  };
} {
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const railExpanded = hovered || focusWithin;

  const onMouseEnter = useCallback(() => {
    setHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHovered(false);
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
    railExpandHandlers: { onMouseEnter, onMouseLeave, onFocus, onBlur }
  };
}
