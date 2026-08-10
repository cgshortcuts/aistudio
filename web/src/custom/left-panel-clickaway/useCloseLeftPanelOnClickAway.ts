import { useCallback, type RefObject } from "react";

import { useClosePanelOnClickAway } from "../panel-clickaway";
import { usePanelStore } from "../../stores/PanelStore";

/**
 * Close the left drawer when the user presses outside the rail + drawer.
 * Desktop only in practice — the mobile sheet uses its own scrim.
 */
export function useCloseLeftPanelOnClickAway(
  containerRef: RefObject<HTMLElement | null>
): void {
  const isVisible = usePanelStore((state) => state.panel.isVisible);
  const setVisibility = usePanelStore((state) => state.setVisibility);
  const onClose = useCallback(() => setVisibility(false), [setVisibility]);

  useClosePanelOnClickAway(containerRef, {
    enabled: isVisible,
    onClose
  });
}
