import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from "react";

import { useAutoFocusEnabled } from "../../hooks/useAutoFocusEnabled";
import { useWorkspaceTabsStore } from "../../stores/WorkspaceTabsStore";
import type { AssetSearchFocusSurface } from "./assetSearchAutofocusSurface";
import { useAssetSearchAutofocusStore } from "./AssetSearchAutofocusStore";

const ASSETS_PAGE_TAB_ID = "page:assets";

export function useAssetSearchAutofocus(
  surface: AssetSearchFocusSurface | undefined
): {
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  focusSearchInput: boolean;
  focusNonce: number;
} {
  const [expanded, setExpanded] = useState(() => surface != null);
  const autoFocusEnabled = useAutoFocusEnabled();
  const [focusNonce, setFocusNonce] = useState(0);
  const generation = useAssetSearchAutofocusStore((state) => state.generation);
  const requestedSurface = useAssetSearchAutofocusStore(
    (state) => state.surface
  );
  const lastHandledGeneration = useRef(0);

  useEffect(() => {
    if (surface == null || generation === 0) {
      return;
    }
    if (requestedSurface !== surface) {
      return;
    }
    if (generation === lastHandledGeneration.current) {
      return;
    }
    lastHandledGeneration.current = generation;
    setExpanded(true);
    if (autoFocusEnabled) {
      setFocusNonce((nonce) => nonce + 1);
    }
  }, [surface, generation, requestedSurface, autoFocusEnabled]);

  const activeTabId = useWorkspaceTabsStore((state) => state.activeTabId);
  const isAssetsPageActive =
    surface === "assets-page" && activeTabId === ASSETS_PAGE_TAB_ID;
  const skipInitialAssetsActive = useRef(true);

  useEffect(() => {
    if (surface !== "assets-page") {
      return;
    }
    if (!isAssetsPageActive) {
      skipInitialAssetsActive.current = false;
      return;
    }
    if (skipInitialAssetsActive.current) {
      skipInitialAssetsActive.current = false;
      return;
    }
    setExpanded(true);
    if (autoFocusEnabled) {
      setFocusNonce((nonce) => nonce + 1);
    }
  }, [surface, isAssetsPageActive, autoFocusEnabled]);

  return {
    expanded,
    setExpanded,
    focusSearchInput: autoFocusEnabled && focusNonce > 0,
    focusNonce
  };
}
