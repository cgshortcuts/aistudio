/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import type { Theme } from "@mui/material/styles";
import {
  BORDER_RADIUS,
  MOTION,
  SPACING,
  Z_INDEX,
  getSpacingPx
} from "../../components/ui_primitives";

export const assetThumbnailActionStyles = (theme: Theme) =>
  css({
    ".asset-thumbnail-actions": {
      position: "absolute",
      top: getSpacingPx(SPACING.xs),
      right: getSpacingPx(SPACING.xs),
      zIndex: Z_INDEX.modal,
      display: "flex",
      flexDirection: "column",
      gap: getSpacingPx(SPACING.micro)
    },
    ".asset-thumbnail-actions .asset-overlay-btn.MuiIconButton-root": {
      width: getSpacingPx(SPACING.xxl),
      height: getSpacingPx(SPACING.xxl),
      minWidth: getSpacingPx(SPACING.xxl),
      padding: getSpacingPx(SPACING.micro),
      opacity: 0,
      pointerEvents: "none",
      backgroundColor: theme.vars.palette.c_scrim,
      color: theme.vars.palette.grey[100],
      borderRadius: BORDER_RADIUS.sm,
      border: `1px solid rgb(${theme.vars.palette.common.whiteChannel} / 0.16)`,
      backdropFilter: "blur(4px)",
      boxShadow: `0 ${getSpacingPx(SPACING.micro)} ${getSpacingPx(SPACING.xs)} ${theme.vars.palette.c_scrim_soft}`,
      transition: MOTION.opacity,
      "&:hover": {
        backgroundColor: theme.vars.palette.c_scrim_strong,
        color: theme.vars.palette.grey[0]
      }
    },
    "&:hover .asset-thumbnail-actions .asset-overlay-btn.MuiIconButton-root": {
      opacity: 1,
      pointerEvents: "auto"
    },
    ".asset-thumbnail-actions .asset-overlay-btn.checked.MuiIconButton-root, .asset-thumbnail-actions .asset-overlay-btn.starred.MuiIconButton-root":
      {
        opacity: 1,
        pointerEvents: "auto"
      },
    ".asset-thumbnail-actions .asset-overlay-btn.starred.MuiIconButton-root": {
      color: theme.vars.palette.warning.main
    },
    ".asset-thumbnail-actions .asset-overlay-btn .MuiSvgIcon-root": {
      fontSize: "var(--fontSizeSmall)"
    },
    "@media (pointer: coarse)": {
      ".asset-thumbnail-actions .asset-overlay-btn.MuiIconButton-root": {
        opacity: 1,
        pointerEvents: "auto"
      }
    },
    ".filetype.info, .filesize.info": {
      opacity: 0,
      transition: MOTION.opacity
    },
    "&:hover .filetype.info, &:hover .filesize.info": {
      opacity: 1
    }
  });
