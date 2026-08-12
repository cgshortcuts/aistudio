import type { Asset } from "../../stores/ApiTypes";

export type DropzonePasteMediaType = "image" | "audio" | "video";

export interface DropzonePasteTarget {
  id: string;
  mediaType: DropzonePasteMediaType;
  applyAsset: (asset: Asset) => void;
}

export const DROPZONE_PASTE_ID_ATTR = "data-dropzone-paste-id";

const PASTE_MEDIA_TYPES: ReadonlySet<string> = new Set([
  "image",
  "audio",
  "video"
]);

const targets = new Map<string, DropzonePasteTarget>();

export function isDropzonePasteMediaType(
  value: string
): value is DropzonePasteMediaType {
  return PASTE_MEDIA_TYPES.has(value);
}

export function registerDropzonePasteTarget(target: DropzonePasteTarget): void {
  targets.set(target.id, target);
}

export function unregisterDropzonePasteTarget(id: string): void {
  targets.delete(id);
}

export function findDropzonePasteTargetAt(
  x: number,
  y: number
): DropzonePasteTarget | null {
  if (typeof document.elementFromPoint !== "function") {
    return null;
  }
  const el = document.elementFromPoint(x, y);
  if (!(el instanceof Element)) {
    return null;
  }
  const zone = el.closest(`[${DROPZONE_PASTE_ID_ATTR}]`);
  if (!zone) {
    return null;
  }
  const id = zone.getAttribute(DROPZONE_PASTE_ID_ATTR);
  if (!id) {
    return null;
  }
  return targets.get(id) ?? null;
}

export function resetDropzonePasteTarget(): void {
  targets.clear();
}
