/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { memo, useCallback, useMemo } from "react";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import {
  Text,
  BORDER_RADIUS,
  MOTION,
  SPACING,
  getSpacingPx
} from "../../components/ui_primitives";
import {
  useAssetGridStore,
  useAssetGridStoreApi
} from "../../stores/AssetGridStore";
import { useActivateOnKey } from "../../hooks/useActivateOnKey";
import useAuth from "../../stores/useAuth";
import { navigateToAllAssets } from "./navigateToAllAssets";

const ROW_HEIGHT = "1.5rem";
const ICON_SLOT = "18px";

const styles = (theme: Theme) =>
  css({
    "&.all-assets-nav": {
      padding: ".25em .5em 0 .5em"
    },
    ".all-assets-row": {
      display: "flex",
      alignItems: "center",
      gap: ".4em",
      height: ROW_HEIGHT,
      paddingLeft: getSpacingPx(SPACING.micro),
      paddingRight: ".25em",
      cursor: "pointer",
      userSelect: "none",
      borderRadius: BORDER_RADIUS.md,
      transition: `${MOTION.background}, color ${MOTION.fast}`
    },
    ".all-assets-row:hover": {
      backgroundColor: theme.vars.palette.action.hover
    },
    ".all-assets-row .row-icon": {
      width: ICON_SLOT,
      height: ICON_SLOT,
      color: theme.vars.palette.grey[500],
      flexShrink: 0
    },
    ".all-assets-row .row-label": {
      margin: 0,
      fontSize: theme.fontSizeSmall,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: theme.vars.palette.grey[400],
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    ".all-assets-row.selected": {
      backgroundColor: "rgba(var(--palette-primary-main-channel) / 0.12)"
    },
    ".all-assets-row.selected .row-icon": {
      color: theme.vars.palette.primary.main
    },
    ".all-assets-row.selected .row-label": {
      color: theme.vars.palette.primary.main,
      fontWeight: 600
    }
  });

/**
 * Navigator row above FOLDERS: shows every non-folder asset in the library
 * (folder tree + workflow outputs). Mutually exclusive with folder and
 * workflow scope.
 */
const AllAssetsNavItem: React.FC = () => {
  const theme = useTheme();
  const rowStyles = useMemo(() => styles(theme), [theme]);
  const gridStore = useAssetGridStoreApi();
  const currentUser = useAuth((state) => state.user);
  const allAssetsView = useAssetGridStore((state) => state.allAssetsView);
  const workflowFilter = useAssetGridStore((state) => state.workflowFilter);

  const isSelected = allAssetsView && !workflowFilter;

  const handleSelect = useCallback(() => {
    navigateToAllAssets(gridStore, { homeFolderId: currentUser?.id ?? null });
  }, [gridStore, currentUser?.id]);

  const handleKeyDown = useActivateOnKey(handleSelect);

  return (
    <div className="all-assets-nav" css={rowStyles}>
      <div
        className={`all-assets-row ${isSelected ? "selected" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="All assets"
        aria-pressed={isSelected}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
      >
        <Inventory2OutlinedIcon className="row-icon" aria-hidden />
        <Text className="row-label">All</Text>
      </div>
    </div>
  );
};

export default memo(AllAssetsNavItem);
