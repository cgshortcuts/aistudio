import { getMousePosition } from "../../utils/MousePosition";
import type { Asset } from "../../stores/ApiTypes";
import { findDropzonePasteTargetAt } from "./dropzonePasteTarget";

/** Prefer the image dropzone under the pointer; otherwise create a canvas Image node. */
export function resolveClipboardImageHandler(
  fallback: (asset: Asset) => void
): (asset: Asset) => void {
  const point = getMousePosition();
  const target = point
    ? findDropzonePasteTargetAt(point.x, point.y)
    : null;
  if (target?.mediaType === "image") {
    return target.applyAsset;
  }
  return fallback;
}
