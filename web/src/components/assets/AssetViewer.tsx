/** @jsxImportSource @emotion/react */
import { css, keyframes } from "@emotion/react";

// Filmstrip motion. Thumbnails reveal from the center outward as the gallery
// opens (and as new frames scroll in); the active frame pops when it changes.
const thumbReveal = keyframes({
  from: { opacity: 0, transform: "translateY(10px) scale(0.94)" },
  to: { opacity: 1, transform: "translateY(0) scale(1)" }
});

const activePop = keyframes({
  from: { opacity: 0.5, transform: "scale(0.86)" },
  to: { opacity: 1, transform: "scale(1)" }
});

const EASE_OUT_QUINT = "cubic-bezier(0.22, 1, 0.36, 1)";

import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
//mui
import {
  EditorButton,
  Dialog,
  Text,
  MOTION,
  reducedMotion,
  BORDER_RADIUS,
  SPACING,
  Z_INDEX,
  FlexColumn,
  FlexRow,
  ToolbarIconButton,
  CloseButton,
  DownloadButton,
  DeleteButton
} from "../ui_primitives";
//icons
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import CompareIcon from "@mui/icons-material/Compare";
import EditIcon from "@mui/icons-material/Edit";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AssetItem from "./AssetItem";
import AssetInfoPanel from "../context_menus/AssetInfoPanel";
import { ImageComparer } from "../widgets";
//
//components
//store
import { Asset } from "../../stores/ApiTypes";
import { useWorkspaceTabsStore } from "../../stores/WorkspaceTabsStore";
import { useAssetGridStore } from "../../stores/AssetGridStore";
//utils
import useAssets from "../../serverState/useAssets";
import { useCombo } from "../../stores/KeyPressedStore";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { useAssetDownload } from "../../hooks/assets/useAssetDownload";
import { useAssetNavigation } from "../../hooks/assets/useAssetNavigation";
import { useAssetDisplay } from "../../hooks/assets/useAssetDisplay";
import { useEditVideoAsset } from "../../hooks/useEditVideoAsset";
import { useNavigate } from "react-router-dom";
import { isEditableModel3DAsset } from "../model_editor/isEditableModel3D";
import { isElectron } from "../../utils/browser";
import { copyAssetToClipboard, isClipboardSupported } from "../../utils/clipboardUtils";
// === CUSTOM FORK START: asset-viewer-lightbox ===
import {
  ShortcutHintsBar,
  toggleRegisteredMediaPlay,
  useAssetViewerLightboxStore
} from "../../custom/asset-viewer-lightbox";
// === CUSTOM FORK END ===

const containerStyles = css({
  width: "100%",
  height: "100%",
  overflow: "hidden",
  margin: 0,
  position: "relative",
  pointerEvents: "none"
});

const styles = (theme: Theme) =>
  css({
    "&": {
      margin: 0,
      height: "100%",
      width: "100%",
      top: 0,
      display: "block"
    },
    ".MuiModal-root": {
      zIndex: theme.zIndex.floating
    },
    ".MuiPaper-root": {
      overflow: "hidden",
      height: "100vh",
      maxHeight: "100vh",
      backgroundColor: theme.vars.palette.grey[900],
      width: "100vw",
      maxWidth: "100vw",
      zIndex: theme.zIndex.floating,
      margin: 0,
      borderRadius: 0,
      position: "relative"
    },
    // The shared Dialog primitive wraps children in MUI's DialogContent, whose
    // default padding would push the viewer down (gap on top) and inset the
    // overlay controls. Make it a bare full-bleed, positioned container so the
    // media fills the screen and the toolbar/close button anchor to the edges.
    ".MuiDialogContent-root, .dialog-content": {
      padding: 0,
      margin: 0,
      width: "100%",
      height: "100%",
      overflow: "hidden",
      position: "relative",
      display: "block"
    },
    ".current-folder": {
      top: "20px"
    },
    // === CUSTOM FORK START: asset-viewer-lightbox ===
    ".viewer-body": {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: "120px",
      display: "flex",
      flexDirection: "row",
      alignItems: "stretch",
      minHeight: 0,
      pointerEvents: "auto"
    },
    ".preview-column": {
      flex: "1 1 auto",
      minWidth: 0,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      position: "relative"
    },
    ".preview-stage": {
      flex: "1 1 auto",
      minHeight: 0,
      width: "100%",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    },
    ".preview-stage .image-viewer": {
      height: "100%"
    },
    ".preview-stage .video-viewer": {
      height: "100%",
      marginTop: 0,
      width: "100%"
    },
    ".preview-stage .video-viewer video": {
      width: "auto",
      maxWidth: "90%",
      maxHeight: "100%"
    },
    ".preview-stage .audio-viewer": {
      width: "min(80vw, 100%)",
      margin: "0 auto",
      maxHeight: "100%",
      justifyContent: "center"
    },
    ".actions": {
      zIndex: Z_INDEX.tooltip,
      flex: "0 0 auto",
      position: "relative",
      top: "auto",
      right: "auto",
      width: "100%",
      boxSizing: "border-box",
      marginTop: theme.spacing(SPACING.xl),
      marginBottom: theme.spacing(SPACING.xl),
      paddingLeft: theme.spacing(SPACING.xl),
      paddingRight: theme.spacing(SPACING.xl),
      pointerEvents: "auto"
    },
    ".actions-buttons": {
      flex: "0 0 auto",
      marginLeft: "auto"
    },
    ".actions .button": {
      width: theme.spacing(SPACING.xxl),
      height: theme.spacing(SPACING.xxl),
      minWidth: theme.spacing(SPACING.xxl),
      backgroundColor: theme.vars.palette.background.paper,
      color: theme.vars.palette.grey[400],
      border: `1px solid ${theme.vars.palette.action.disabledBackground}`,
      borderRadius: BORDER_RADIUS.sm,
      padding: theme.spacing(SPACING.micro)
    },
    ".actions button svg": {
      fontSize: theme.fontSizeBig
    },
    ".actions .button:hover": {
      backgroundColor: theme.vars.palette.action.hover,
      color: theme.vars.palette.grey[200]
    },
    ".info-panel-sidebar": {
      flex: "0 0 280px",
      height: "100%",
      overflowY: "auto",
      zIndex: Z_INDEX.raised,
      backgroundColor: theme.vars.palette.grey[900],
      borderLeft: `1px solid ${theme.vars.palette.grey[700]}`,
      pointerEvents: "auto"
    },
    ".info-panel-sidebar .asset-info-panel, .info-panel-sidebar > div": {
      maxHeight: "none",
      height: "100%",
      width: "100%",
      borderLeft: "none"
    },
    // === CUSTOM FORK END ===
    // -------------------
    ".asset-navigation": {
      position: "absolute",
      width: "100%",
      height: "120px",
      padding: "0 0 .5em 0",
      backgroundColor: theme.vars.palette.grey[900],
      bottom: 0,
      zIndex: Z_INDEX.overlay,
      pointerEvents: "auto"
    },
    ".prev-next-items": {
      width: "430px",
      maxWidth: "30vw"
    },
    ".prev-next-items.current": {
      boxSizing: "border-box",
      flexShrink: 0,
      width: "100px",
      height: "100px",
      overflow: "hidden",
      borderRadius: BORDER_RADIUS.lg,
      border: `2px solid ${theme.vars.palette.primary.main}`,
      boxShadow: `0 0 0 4px rgb(${theme.vars.palette.primary.mainChannel} / 0.18), 0 12px 32px rgb(0 0 0 / 0.5)`,
      // Re-keyed by asset id on navigation, so this replays each time the
      // centered frame changes — a quick confident pop, no bounce.
      animation: `${activePop} ${MOTION.slow}`
    },
    ".prev-next-items .item": {
      backgroundColor: theme.vars.palette.background.paper,
      padding: "0",
      width: "120px",
      height: "80px",
      overflow: "hidden",
      borderRadius: BORDER_RADIUS.md,
      cursor: "pointer !important",
      willChange: "transform",
      transition: `transform var(--motion-normal) ${EASE_OUT_QUINT}, ${MOTION.shadow}`,
      // `backwards` keeps the from-state during the stagger delay but releases
      // the element afterward, so the hover transition below still applies.
      animation: `${thumbReveal} ${MOTION.slow} backwards`
    },
    ".prev-next-items .item:hover": {
      transform: "translateY(-6px) scale(1.06)",
      boxShadow: "0 12px 26px rgb(0 0 0 / 0.45)",
      zIndex: Z_INDEX.raised
    },
    // Press feedback: quick dip on click before the frame slides to center.
    ".prev-next-items .item:active": {
      transform: "translateY(-1px) scale(0.95)",
      transition: MOTION.transform,
      zIndex: Z_INDEX.raised
    },
    // Cascade from the center outward: nearest-to-center frame leads. These
    // per-item stagger delays are functional offsets, not a motion-design tier,
    // so they stay as explicit ms values (see DESIGN.md §5).
    ".prev-next-items.left .item:nth-last-child(1)": { animationDelay: `${20}ms` },
    ".prev-next-items.left .item:nth-last-child(2)": { animationDelay: `${60}ms` },
    ".prev-next-items.left .item:nth-last-child(3)": { animationDelay: `${100}ms` },
    ".prev-next-items.left .item:nth-last-child(4)": { animationDelay: `${140}ms` },
    ".prev-next-items.left .item:nth-last-child(5)": { animationDelay: `${180}ms` },
    ".prev-next-items.right .item:nth-child(1)": { animationDelay: `${20}ms` },
    ".prev-next-items.right .item:nth-child(2)": { animationDelay: `${60}ms` },
    ".prev-next-items.right .item:nth-child(3)": { animationDelay: `${100}ms` },
    ".prev-next-items.right .item:nth-child(4)": { animationDelay: `${140}ms` },
    ".prev-next-items.right .item:nth-child(5)": { animationDelay: `${180}ms` },
    ...reducedMotion({
      ".prev-next-items .item, .prev-next-items.current": {
        animation: "none",
        transition: "none"
      },
      ".prev-next-items .item:hover, .prev-next-items .item:active": {
        transform: "none"
      }
    }),
    ".prev-next-items .item .asset-item": {
      cursor: "pointer"
    },
    ".compare-mode-bar": {
      position: "absolute",
      top: theme.spacing(SPACING.xxxl),
      left: "50%",
      transform: "translateX(-50%)",
      padding: theme.spacing(1, 2),
      backgroundColor: theme.vars.palette.background.paper,
      borderRadius: BORDER_RADIUS.md,
      zIndex: Z_INDEX.modal,
      color: theme.vars.palette.text.primary,
      fontSize: theme.fontSizeSmall
    },
    ".compare-mode-bar button": {
      color: theme.vars.palette.text.primary,
      textTransform: "none"
    },
    ".select-for-compare": {
      position: "absolute",
      bottom: "130px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: Z_INDEX.modal,
      padding: theme.spacing(1, 1.5),
      backgroundColor: theme.vars.palette.background.paper,
      borderRadius: BORDER_RADIUS.md,
      fontSize: theme.fontSizeSmaller,
      color: theme.vars.palette.text.primary
    },
    ".prev-next-items .item.compare-selected": {
      outline: "3px solid",
      outlineColor: theme.vars.palette.primary.main
    }
  });

type AssetViewerProps = {
  asset?: Asset;
  sortedAssets?: Asset[];
  url?: string;
  open: boolean;
  contentType?: string;
  onClose: () => void;
};

const AssetViewer: React.FC<AssetViewerProps> = (props) => {
  const theme = useTheme();
  const {
    asset,
    sortedAssets,
    url,
    open,
    contentType,
    onClose: handleClose
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [currentAsset, setCurrentAsset] = useState<Asset | undefined>(asset);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const prevNextAmount = 5;

  // === CUSTOM FORK START: asset-viewer-lightbox ===
  // Info panel preference persists across sessions / viewer closes.
  const showInfo = useAssetViewerLightboxStore((state) => state.showInfo);
  const toggleInfo = useAssetViewerLightboxStore((state) => state.toggleShowInfo);
  const setSelectedAssetIds = useAssetGridStore((state) => state.setSelectedAssetIds);
  const setSelectedAssets = useAssetGridStore((state) => state.setSelectedAssets);
  const setDeleteDialogOpen = useAssetGridStore((state) => state.setDeleteDialogOpen);
  const setOpenAsset = useAssetGridStore((state) => state.setOpenAsset);
  const pendingDeleteIdRef = useRef<string | null>(null);
  const pendingDeleteIndexRef = useRef<number | null>(null);

  const handleDeleteCurrentAsset = useCallback(() => {
    if (!currentAsset) {
      return;
    }
    pendingDeleteIdRef.current = currentAsset.id;
    pendingDeleteIndexRef.current = currentIndex;
    setSelectedAssetIds([currentAsset.id]);
    setSelectedAssets([currentAsset]);
    setDeleteDialogOpen(true);
  }, [
    currentAsset,
    currentIndex,
    setSelectedAssetIds,
    setSelectedAssets,
    setDeleteDialogOpen
  ]);
  // === CUSTOM FORK END ===

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false);
  const [compareAssetA, setCompareAssetA] = useState<Asset | null>(null);
  const [compareAssetB, setCompareAssetB] = useState<Asset | null>(null);

  // Editing opens the asset in a workspace tab (image → sketch editor,
  // model3d → 3D editor), retiring the legacy /assets/edit route.
  const openTab = useWorkspaceTabsStore((state) => state.openTab);
  const navigate = useNavigate();
  const editVideoAsset = useEditVideoAsset();

  // Reset compare mode when viewer closes
  useEffect(() => {
    if (!open) {
      setCompareMode(false);
      setCompareAssetA(null);
      setCompareAssetB(null);
    }
  }, [open]);

  const { folderFiles } = useAssets();

  const assetsToUse = useMemo(
    () => sortedAssets || folderFiles || [],
    [sortedAssets, folderFiles]
  );

  // === CUSTOM FORK START: asset-viewer-lightbox ===
  // After delete, stay in the lightbox and show the next (or previous) asset.
  useEffect(() => {
    const pendingId = pendingDeleteIdRef.current;
    if (!open || !pendingId) {
      return;
    }
    if (assetsToUse.some((item) => item.id === pendingId)) {
      return;
    }

    pendingDeleteIdRef.current = null;
    const deleteIndex = pendingDeleteIndexRef.current ?? 0;
    pendingDeleteIndexRef.current = null;

    if (assetsToUse.length === 0) {
      handleClose();
      return;
    }

    const nextIndex = Math.min(deleteIndex, assetsToUse.length - 1);
    const nextAsset = assetsToUse[nextIndex];
    setCurrentAsset(nextAsset);
    setCurrentIndex(nextIndex);
    setOpenAsset(nextAsset);
  }, [open, assetsToUse, handleClose, setOpenAsset]);
  // === CUSTOM FORK END ===

  const { handleDownload } = useAssetDownload({ currentAsset, url });

  const isImage = useMemo(() => {
    const ct = currentAsset?.content_type || contentType;
    return ct?.startsWith("image/") || false;
  }, [currentAsset?.content_type, contentType]);

  // Check if current asset is an editable 3D model (.glb/.gltf)
  const isModel3D = useMemo(
    () => (currentAsset ? isEditableModel3DAsset(currentAsset) : false),
    [currentAsset]
  );

  // Check if current asset is audio (editable in the sample editor)
  const isAudio = useMemo(() => {
    const ct = currentAsset?.content_type || contentType;
    return ct?.startsWith("audio/") || false;
  }, [currentAsset?.content_type, contentType]);

  // Check if current asset is a video (editable via its source timeline)
  const isVideo = useMemo(() => {
    const ct = currentAsset?.content_type || contentType;
    return ct?.startsWith("video/") || false;
  }, [currentAsset?.content_type, contentType]);

  const imageAssets = useMemo(
    () => assetsToUse.filter((a) => a.content_type?.startsWith("image/")),
    [assetsToUse]
  );
  const canCompare = isImage && imageAssets.length >= 2;

  const viewerActionButtonSx = useMemo<SxProps<Theme>>(
    () => ({
      // === CUSTOM FORK START: asset-viewer-lightbox ===
      // Size comes from `.actions .button` CSS (rounded square).
      backgroundColor: theme.vars.palette.background.paper,
      color: theme.vars.palette.grey[400],
      border: `1px solid ${theme.vars.palette.action.disabledBackground}`,
      borderRadius: BORDER_RADIUS.sm,
      padding: theme.spacing(SPACING.micro),
      "&:hover": {
        backgroundColor: theme.vars.palette.action.hover,
        color: theme.vars.palette.grey[200]
      },
      "& svg": {
        fontSize: theme.fontSizeBig
      }
      // === CUSTOM FORK END ===
    }),
    [theme]
  );

  // Compare mode handlers
  const startCompareMode = useCallback(() => {
    if (currentAsset) {
      setCompareMode(true);
      setCompareAssetA(currentAsset);
      setCompareAssetB(null);
    }
  }, [currentAsset]);

  const cancelCompareMode = useCallback(() => {
    setCompareMode(false);
    setCompareAssetA(null);
    setCompareAssetB(null);
  }, []);

  const selectAssetForCompare = useCallback(
    (selectedAsset: Asset) => {
      if (!compareMode) {
        return;
      }
      if (compareAssetA && selectedAsset.id !== compareAssetA.id) {
        setCompareAssetB(selectedAsset);
      }
    },
    [compareMode, compareAssetA]
  );

  const exitCompareView = useCallback(() => {
    setCompareAssetB(null);
  }, []);

  const handleOpenImageEditor = useCallback(() => {
    if (currentAsset && isImage) {
      openTab({
        type: "image",
        ref: currentAsset.id,
        mode: "edit",
        title: currentAsset.name || "Image"
      });
      navigate("/workspace");
      handleClose();
    }
  }, [currentAsset, isImage, openTab, navigate, handleClose]);

  const handleOpenModel3DEditor = useCallback(() => {
    if (currentAsset && isModel3D) {
      openTab({
        type: "model3d",
        ref: currentAsset.id,
        mode: "edit",
        title: currentAsset.name || "3D model"
      });
      navigate("/workspace");
      handleClose();
    }
  }, [currentAsset, isModel3D, openTab, navigate, handleClose]);

  const handleOpenAudioEditor = useCallback(() => {
    if (currentAsset && isAudio) {
      openTab({
        type: "audio",
        ref: currentAsset.id,
        mode: "edit",
        title: currentAsset.name || "Audio"
      });
      navigate("/workspace");
      handleClose();
    }
  }, [currentAsset, isAudio, openTab, navigate, handleClose]);

  const handleOpenVideoEditor = useCallback(() => {
    if (currentAsset && isVideo) {
      void editVideoAsset(currentAsset);
      handleClose();
    }
  }, [currentAsset, isVideo, editVideoAsset, handleClose]);


  // Copy to clipboard state and handler
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCopyToClipboard = useCallback(async () => {
    const assetSrc = currentAsset?.get_url || url;
    const assetContentType = currentAsset?.content_type || contentType;
    const assetName = currentAsset?.name;

    if (!assetSrc || !assetContentType) {
      return;
    }

    try {
      await copyAssetToClipboard(assetContentType, assetSrc, assetName);
      setCopied(true);
      // Clear any existing timeout before setting a new one
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, [currentAsset?.get_url, currentAsset?.content_type, currentAsset?.name, url, contentType]);

  const handleChangeAsset = useCallback(
    (index: number) => {
      if (!assetsToUse) {
        return;
      }
      const newAsset = assetsToUse[index];
      requestAnimationFrame(() => {
        setCurrentAsset(newAsset);
      });
      setCurrentIndex(index);
    },
    [assetsToUse]
  );

  // Cleanup copied timeout on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (asset) {
      setCurrentAsset(asset);
      const index = assetsToUse?.findIndex((item) => item.id === asset.id);
      setCurrentIndex(index !== undefined && index !== -1 ? index : null);
    }
  }, [asset, assetsToUse]);

  const { changeAsset } = useAssetNavigation({
    open,
    assets: assetsToUse,
    currentIndex,
    prevNextAmount,
    onChangeIndex: handleChangeAsset
  });
  useCombo(
    ["left"],
    useCallback(() => {
      if (open) {
        changeAsset("left", false);
      }
    }, [changeAsset, open])
  );
  useCombo(
    ["right"],
    useCallback(() => {
      if (open) {
        changeAsset("right", false);
      }
    }, [changeAsset, open])
  );
  useCombo(
    ["ctrl", "left"],
    useCallback(() => {
      if (open) {
        changeAsset("left", true);
      }
    }, [changeAsset, open])
  );
  useCombo(
    ["ctrl", "right"],
    useCallback(() => {
      if (open) {
        changeAsset("right", true);
      }
    }, [changeAsset, open])
  );
  // === CUSTOM FORK START: asset-viewer-lightbox ===
  useCombo(
    [" "],
    useCallback(() => {
      if (!open || compareMode || compareAssetB) {
        return;
      }
      const ct = currentAsset?.content_type || contentType || "";
      if (!ct.startsWith("video/") && !ct.startsWith("audio/")) {
        return;
      }
      toggleRegisteredMediaPlay();
    }, [open, compareMode, compareAssetB, currentAsset?.content_type, contentType])
  );
  useCombo(
    ["delete"],
    useCallback(() => {
      if (!open || compareMode || compareAssetB || !sortedAssets || !currentAsset) {
        return;
      }
      handleDeleteCurrentAsset();
    }, [
      open,
      compareMode,
      compareAssetB,
      sortedAssets,
      currentAsset,
      handleDeleteCurrentAsset
    ])
  );

  const shortcutHints = useMemo(() => {
    const hints = [
      { keys: ["←"], label: "Prev" },
      { keys: ["→"], label: "Next" }
    ];
    const ct = currentAsset?.content_type || contentType || "";
    if (ct.startsWith("video/") || ct.startsWith("audio/")) {
      hints.push({ keys: ["Space"], label: "Play/Pause" });
    }
    if (sortedAssets) {
      hints.push({ keys: ["Del"], label: "Delete" });
    }
    hints.push({ keys: ["Esc"], label: "Exit" });
    return hints;
  }, [currentAsset?.content_type, contentType, sortedAssets]);
  // === CUSTOM FORK END ===

  const { component: assetViewer } = useAssetDisplay({
    asset: currentAsset,
    url,
    contentType
  });

  // Handle clicking a thumbnail - either navigate or select for compare
  const handleThumbnailClick = useCallback(
    (thumbnailAsset: Asset, assetIndex: number) => {
      if (compareMode && !compareAssetB) {
        // In compare mode - select second asset
        selectAssetForCompare(thumbnailAsset);
      } else {
        // Normal mode - navigate to asset
        handleChangeAsset(assetIndex);
      }
    },
    [compareMode, compareAssetB, selectAssetForCompare, handleChangeAsset]
  );

  const navigation = useMemo(() => {
    if (currentIndex === null) {
      return null;
    }
    // Hide navigation when showing comparison
    if (compareAssetB) {
      return null;
    }
    const prevAssets =
      assetsToUse?.slice(
        Math.max(0, currentIndex - prevNextAmount),
        currentIndex
      ) || [];
    const nextAssets =
      assetsToUse?.slice(currentIndex + 1, currentIndex + prevNextAmount + 1) ||
      [];

    // Filter to images only when in compare mode
    const filterForCompare = (assets: Asset[]) =>
      compareMode
        ? assets.filter((a) => a.content_type?.startsWith("image/"))
        : assets;

    const displayPrevAssets = filterForCompare(prevAssets);
    const displayNextAssets = filterForCompare(nextAssets);

    return (
      <FlexRow className="asset-navigation" align="flex-end" justify="center" gap={SPACING.xs}>
        <FlexRow className="prev-next-items left" align="center" justify="flex-end" gap={SPACING.micro}>
          {displayPrevAssets?.map((asset, idx) => {
            const assetIndex = Math.max(
              0,
              currentIndex - prevAssets.length + idx
            );
            const isCompareSelected = compareAssetA?.id === asset.id;
            return (
              <EditorButton
                className={`item ${isCompareSelected ? "compare-selected" : ""
                  }`}
                key={asset.id || idx}
                onMouseDown={() => handleThumbnailClick(asset, assetIndex)}
                density="compact"
              >
                <AssetItem
                  asset={asset}
                  draggable={false}
                  isParent={false}
                  showDeleteButton={false}
                  showHoverActions={false}
                  enableContextMenu={false}
                  showName={false}
                  showDuration={true}
                  showFiletype={true}
                />
              </EditorButton>
            );
          })}
        </FlexRow>
        <FlexRow
          key={currentAsset?.id}
          className={`prev-next-items current ${compareAssetA?.id === currentAsset?.id ? "compare-selected" : ""
            }`}
          align="center"
          justify="center"
        >
          <AssetItem
            asset={currentAsset as Asset}
            draggable={false}
            isParent={false}
            showDeleteButton={false}
            showHoverActions={false}
            enableContextMenu={false}
            showName={false}
            showDuration={true}
            showFiletype={true}
          />
        </FlexRow>
        <FlexRow className="prev-next-items right" align="center" justify="flex-start" gap={SPACING.micro}>
          {displayNextAssets?.map((asset, idx) => {
            const assetIndex = currentIndex + 1 + idx;
            const isCompareSelected = compareAssetA?.id === asset.id;
            return (
              <EditorButton
                className={`item ${isCompareSelected ? "compare-selected" : ""
                  }`}
                key={asset.id || idx}
                onMouseDown={() => handleThumbnailClick(asset, assetIndex)}
                density="compact"
              >
                <AssetItem
                  asset={asset}
                  draggable={false}
                  isParent={false}
                  showDeleteButton={false}
                  showHoverActions={false}
                  enableContextMenu={false}
                  showName={false}
                  showDuration={true}
                  showFiletype={true}
                />
              </EditorButton>
            );
          })}
        </FlexRow>
      </FlexRow>
    );
  }, [
    currentIndex,
    assetsToUse,
    currentAsset,
    handleThumbnailClick,
    compareMode,
    compareAssetA,
    compareAssetB
  ]);

  if (!open) {
    return null;
  }

  return (
    <div ref={containerRef} css={containerStyles}>
      <Dialog
        css={styles(theme)}
        maxWidth={false}
        fullWidth
        open={open}
        onClose={handleClose}
        aria-label="Asset viewer"
        slotProps={{
          // Override the primitive's default glass/rounded/bordered paper so the
          // viewer is a true edge-to-edge fullscreen surface with no top gap.
          paper: {
            style: {
              borderRadius: 0,
              border: "none",
              margin: 0,
              width: "100vw",
              maxWidth: "100vw",
              height: "100vh",
              maxHeight: "100vh",
              overflow: "hidden",
              position: "relative",
              background: theme.vars.palette.grey[900],
              backdropFilter: "none"
            }
          },
          backdrop: {
            style: {
              backgroundColor: theme.vars.palette.grey[900]
            }
          }
        }}
      >
        {/* Compare mode instruction bar */}
        {compareMode && !compareAssetB && (
          <FlexRow className="compare-mode-bar" gap={SPACING.xs} align="center">
            <Text size="small">
              Select another image from the thumbnails below to compare
            </Text>
            <EditorButton density="compact" onClick={cancelCompareMode}>
              Cancel
            </EditorButton>
          </FlexRow>
        )}

        {/* === CUSTOM FORK START: asset-viewer-lightbox === */}
        <div className="viewer-body">
          <FlexColumn className="preview-column" gap={SPACING.none}>
            {/*
              Top bar: shortcut hints on the left, actions on the right.
              Rendered above the media so controls stay clear of the preview.
            */}
            <FlexRow
              className="actions"
              gap={SPACING.lg}
              align="center"
              justify="space-between"
              sx={{ zIndex: Z_INDEX.tooltip }}
            >
              {!compareAssetB && (
                <ShortcutHintsBar hints={shortcutHints} />
              )}
              <FlexRow
                className="actions-buttons"
                gap={SPACING.lg}
                align="center"
              >
              <DownloadButton
                onClick={handleDownload}
                className="button download"
                nodrag={false}
                sx={viewerActionButtonSx}
              />
              {isImage && !compareMode && (
                <ToolbarIconButton
                  icon={<EditIcon />}
                  tooltip="Edit Image"
                  onClick={handleOpenImageEditor}
                  className="button edit"
                  nodrag={false}
                  sx={viewerActionButtonSx}
                />
              )}
              {isModel3D && !compareMode && (
                <ToolbarIconButton
                  icon={<EditIcon />}
                  tooltip="Edit in 3D Editor"
                  onClick={handleOpenModel3DEditor}
                  className="button edit"
                  nodrag={false}
                  sx={viewerActionButtonSx}
                />
              )}
              {isAudio && !compareMode && (
                <ToolbarIconButton
                  icon={<EditIcon />}
                  tooltip="Edit Audio"
                  onClick={handleOpenAudioEditor}
                  className="button edit"
                  nodrag={false}
                  sx={viewerActionButtonSx}
                />
              )}
              {isVideo && !compareMode && (
                <ToolbarIconButton
                  icon={<EditIcon />}
                  tooltip={
                    currentAsset?.timeline_id
                      ? "Edit Timeline"
                      : "Create Timeline from Video"
                  }
                  onClick={handleOpenVideoEditor}
                  className="button edit"
                  nodrag={false}
                  sx={viewerActionButtonSx}
                />
              )}
              {isElectron && currentAsset?.content_type && isClipboardSupported(currentAsset.content_type) && (
                <ToolbarIconButton
                  icon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                  tooltip={
                    copied
                      ? "Copied!"
                      : currentAsset.content_type.startsWith("image/")
                        ? "Copy Image"
                        : currentAsset.content_type.startsWith("video/")
                          ? "Copy Video Info"
                          : currentAsset.content_type.startsWith("audio/")
                            ? "Copy Audio Info"
                            : "Copy Content"
                  }
                  onClick={handleCopyToClipboard}
                  className="button copy"
                  nodrag={false}
                  sx={viewerActionButtonSx}
                />
              )}
              {canCompare && !compareMode && !compareAssetB && (
                <ToolbarIconButton
                  icon={<CompareIcon />}
                  tooltip="Compare with another image"
                  onClick={startCompareMode}
                  className="button compare"
                  nodrag={false}
                  sx={viewerActionButtonSx}
                />
              )}
              {currentAsset && !compareMode && (
                <ToolbarIconButton
                  icon={<InfoOutlinedIcon />}
                  tooltip={showInfo ? "Hide info" : "Show info"}
                  onClick={toggleInfo}
                  className="button info"
                  nodrag={false}
                  sx={viewerActionButtonSx}
                />
              )}
              {/* === CUSTOM FORK START: asset-viewer-lightbox === */}
              {currentAsset && sortedAssets && !compareMode && (
                <DeleteButton
                  onClick={handleDeleteCurrentAsset}
                  tooltip="Delete"
                  className="button delete"
                  nodrag={false}
                  sx={viewerActionButtonSx}
                />
              )}
              {/* === CUSTOM FORK END === */}
              <CloseButton
                onClick={compareAssetB ? exitCompareView : handleClose}
                tooltip="Close"
                className="button close"
                nodrag={false}
                sx={viewerActionButtonSx}
              />
              </FlexRow>
            </FlexRow>

            <div className="preview-stage">
              {compareAssetA && compareAssetB ? (
                <div style={{ width: "100%", height: "100%" }}>
                  <ImageComparer
                    imageA={compareAssetA.get_url || ""}
                    imageB={compareAssetB.get_url || ""}
                    labelA={compareAssetA.name || "A"}
                    labelB={compareAssetB.name || "B"}
                    showLabels={true}
                    showMetadata={true}
                    initialMode="horizontal"
                  />
                </div>
              ) : (
                assetViewer
              )}
            </div>
          </FlexColumn>

          {showInfo && currentAsset && !compareMode && (
            <div className="info-panel-sidebar">
              <AssetInfoPanel asset={currentAsset} />
            </div>
          )}
        </div>
        {/* === CUSTOM FORK END === */}
        {navigation}
      </Dialog>
    </div>
  );
};

export default memo(AssetViewer);
