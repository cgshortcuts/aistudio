import {
  CANVAS_PAN_ACTIVATION_KEY,
  CANVAS_PAN_MOUSE_BUTTONS,
  getCanvasDragInteraction
} from "../canvasPanSelect";

describe("getCanvasDragInteraction", () => {
  it("uses left-drag for a selection marquee, not pan", () => {
    const interaction = getCanvasDragInteraction();

    expect(interaction.selectionOnDrag).toBe(true);
    expect(interaction.panOnDrag).toEqual(CANVAS_PAN_MOUSE_BUTTONS);
    expect(interaction.panOnDrag).not.toContain(0);
  });

  it("pans when Alt is held", () => {
    const interaction = getCanvasDragInteraction();

    expect(interaction.panActivationKeyCode).toBe("Alt");
    expect(interaction.panActivationKeyCode).toBe(CANVAS_PAN_ACTIVATION_KEY);
  });

  it("still pans with middle and right mouse buttons", () => {
    expect(CANVAS_PAN_MOUSE_BUTTONS).toEqual([1, 2]);
  });
});
