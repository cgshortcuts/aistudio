/**
 * Workflow canvas pointer gestures for this fork.
 *
 * Left-drag on empty canvas draws a selection marquee.
 * Alt+left-drag pans. Middle and right mouse also pan.
 */

/** Mouse buttons that pan without a modifier. 1 = middle, 2 = right. */
export const CANVAS_PAN_MOUSE_BUTTONS: number[] = [1, 2];

/** Hold this key and left-drag to pan the workflow canvas. */
export const CANVAS_PAN_ACTIVATION_KEY = "Alt";

export type CanvasDragInteraction = {
  panOnDrag: number[];
  selectionOnDrag: boolean;
  panActivationKeyCode: string;
};

export function getCanvasDragInteraction(): CanvasDragInteraction {
  return {
    panOnDrag: CANVAS_PAN_MOUSE_BUTTONS,
    selectionOnDrag: true,
    panActivationKeyCode: CANVAS_PAN_ACTIVATION_KEY
  };
}
