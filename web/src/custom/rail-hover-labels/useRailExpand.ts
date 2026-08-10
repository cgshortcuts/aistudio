import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent
} from "react";
import { RAIL_LEAVE_DELAY_MS } from "./constants";

/**
 * Hover + focus-within expand state for the left icon rail overlay.
 * Leave is delayed so the cursor can move across items without flicker.
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
  const leaveTimerRef = useRef<number | null>(null);
  const railExpanded = hovered || focusWithin;

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current != null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer]);

  const onMouseEnter = useCallback(() => {
    clearLeaveTimer();
    setHovered(true);
  }, [clearLeaveTimer]);

  const onMouseLeave = useCallback(() => {
    clearLeaveTimer();
    leaveTimerRef.current = window.setTimeout(() => {
      setHovered(false);
      leaveTimerRef.current = null;
    }, RAIL_LEAVE_DELAY_MS);
  }, [clearLeaveTimer]);

  const onFocus = useCallback(() => {
    clearLeaveTimer();
    setFocusWithin(true);
  }, [clearLeaveTimer]);

  const onBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
        return;
      }
      clearLeaveTimer();
      leaveTimerRef.current = window.setTimeout(() => {
        setFocusWithin(false);
        leaveTimerRef.current = null;
      }, RAIL_LEAVE_DELAY_MS);
    },
    [clearLeaveTimer]
  );

  return {
    railExpanded,
    railExpandHandlers: { onMouseEnter, onMouseLeave, onFocus, onBlur }
  };
}
