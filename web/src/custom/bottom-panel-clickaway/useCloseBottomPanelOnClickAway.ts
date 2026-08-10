import { useCallback, type RefObject } from "react";

import { useClosePanelOnClickAway } from "../panel-clickaway";
import { useBottomPanelStore } from "../../stores/BottomPanelStore";

/**
 * Close the bottom panel (queue, logs, …) when the user presses outside it.
 * The tab header stays part of the container so tab clicks still toggle/switch.
 */
export function useCloseBottomPanelOnClickAway(
  containerRef: RefObject<HTMLElement | null>
): void {
  const isVisible = useBottomPanelStore((state) => state.panel.isVisible);
  const setVisibility = useBottomPanelStore((state) => state.setVisibility);
  const onClose = useCallback(() => setVisibility(false), [setVisibility]);

  useClosePanelOnClickAway(containerRef, {
    enabled: isVisible,
    onClose
  });
}
