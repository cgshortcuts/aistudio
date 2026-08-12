import type { CSSProperties } from "react";
import { INACTIVE_TAB_STYLE, tabLayerProps } from "../tabLayerStyles";

/**
 * Models the CSS Visibility gotcha that ghosted the node editor onto the
 * Entities page: a `visibility: visible` descendant paints through a
 * `visibility: hidden` ancestor. Opacity has no matching escape hatch.
 */
function descendantPunchesThrough(
  parent: Pick<CSSProperties, "visibility" | "opacity">,
  childVisibility: NonNullable<CSSProperties["visibility"]>
): boolean {
  const escapesVisibilityHidden =
    parent.visibility === "hidden" && childVisibility === "visible";
  const blockedByOpacity = parent.opacity === 0;
  return escapesVisibilityHidden && !blockedByOpacity;
}

describe("tabLayerStyles", () => {
  it("documents why visibility-only hiding fails for ReactFlow nodes", () => {
    expect(
      descendantPunchesThrough({ visibility: "hidden" }, "visible")
    ).toBe(true);
    expect(descendantPunchesThrough({ opacity: 0 }, "visible")).toBe(false);
    expect(
      descendantPunchesThrough({ visibility: "hidden", opacity: 0 }, "visible")
    ).toBe(false);
  });

  it("hides inactive tabs with opacity so visibility:visible node CSS cannot ghost-paint", () => {
    expect(INACTIVE_TAB_STYLE.opacity).toBe(0);
    expect(
      descendantPunchesThrough(INACTIVE_TAB_STYLE, "visible")
    ).toBe(false);
  });

  it("marks inactive layers inert for focus", () => {
    expect(tabLayerProps(true)).toEqual({ style: expect.any(Object) });
    expect(tabLayerProps(false)).toEqual({
      style: INACTIVE_TAB_STYLE,
      inert: true
    });
  });
});
