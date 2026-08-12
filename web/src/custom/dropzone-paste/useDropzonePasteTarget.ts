import { useEffect, useRef } from "react";
import type { Asset } from "../../stores/ApiTypes";
import {
  isDropzonePasteMediaType,
  registerDropzonePasteTarget,
  unregisterDropzonePasteTarget
} from "./dropzonePasteTarget";

interface UseDropzonePasteTargetOptions {
  mediaType: string;
  applyAsset: (asset: Asset) => void;
}

export function useDropzonePasteTarget({
  mediaType,
  applyAsset
}: UseDropzonePasteTargetOptions): { pasteTargetId: string | undefined } {
  const idRef = useRef(crypto.randomUUID());
  const applyAssetRef = useRef(applyAsset);
  applyAssetRef.current = applyAsset;
  const enabled = isDropzonePasteMediaType(mediaType);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const id = idRef.current;
    registerDropzonePasteTarget({
      id,
      mediaType,
      applyAsset: (asset) => {
        applyAssetRef.current(asset);
      }
    });
    return () => {
      unregisterDropzonePasteTarget(id);
    };
  }, [enabled, mediaType]);

  return { pasteTargetId: enabled ? idRef.current : undefined };
}

