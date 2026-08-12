import type React from "react";
import { Z_INDEX } from "../ui_primitives";

/**
 * Inactive tabs stay mounted (viewport / editor state survives switches) but
 * must not paint over the active page.
 *
 * Use `opacity: 0`, not `visibility: hidden`. Node CSS (zoomed-out previews,
 * Dynamic*Schema content, collapsed edit fields, …) sets `visibility: visible`
 * on descendants; that re-shows them through a `visibility: hidden` ancestor
 * and ghosts the node editor onto transparent page tabs (Entities, Settings).
 * Opacity is multiplicative — a child cannot punch through `opacity: 0`.
 */
export const ACTIVE_TAB_STYLE: React.CSSProperties = {
  opacity: 1,
  pointerEvents: "auto",
  zIndex: Z_INDEX.raised
};

export const INACTIVE_TAB_STYLE: React.CSSProperties = {
  opacity: 0,
  pointerEvents: "none",
  zIndex: Z_INDEX.base
};

/**
 * Inactive tabs must not keep keyboard focus. `pointer-events: none` alone is
 * not enough — a focused search/composer inside a hidden layer still receives
 * keydown. `inert` removes the subtree from focus and input processing.
 */
export const tabLayerProps = (isActive: boolean) =>
  isActive
    ? { style: ACTIVE_TAB_STYLE }
    : { style: INACTIVE_TAB_STYLE, inert: true as const };
