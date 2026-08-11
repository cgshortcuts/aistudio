/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import type { Theme } from "@mui/material/styles";
import {
  BORDER_RADIUS,
  MOTION,
  SPACING,
  Z_INDEX,
  getSpacingPx,
  reducedMotion
} from "../../components/ui_primitives";
import { TOOLBAR_WIDTH } from "../../config/constants";
import { RAIL_EXPAND_MOTION, TOOLBAR_EXPANDED_WIDTH } from "./constants";

/** Self-contained chrome for the expandable left rail (slot + overlay + labels). */
export const expandableRailToolbarStyles = (theme: Theme) =>
  css({
    pointerEvents: "none",
    width: `${TOOLBAR_WIDTH}px`,
    flexShrink: 0,
    alignSelf: "stretch",
    position: "relative",
    height: "100%",

    "& .vertical-toolbar": {
      pointerEvents: "auto",
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: `${TOOLBAR_WIDTH}px`,
      display: "flex",
      flexDirection: "column",
      gap: getSpacingPx(SPACING.md),
      backgroundColor: theme.vars.palette.background.default,
      borderRight: `1px solid ${theme.vars.palette.divider}`,
      paddingTop: getSpacingPx(SPACING.lg),
      paddingBottom: getSpacingPx(SPACING.lg),
      overflow: "hidden",
      boxShadow: "none",
      transition: `width ${MOTION.fast}, box-shadow ${MOTION.fast}`,
      ...reducedMotion({ transition: MOTION.none }),

      "& .rail-app-logo": {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: "40px",
        height: "40px",
        margin: `0 ${theme.spacing(SPACING.micro)}`
      },

      "& .toolbar-scroll": {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        gap: getSpacingPx(SPACING.md),
        overflowX: "hidden",
        overflowY: "auto",
        overscrollBehavior: "contain",
        scrollbarWidth: "thin"
      },

      "& .toolbar-spacer": {
        flexGrow: 1,
        minHeight: 0
      },

      "&:hover, &:has(:focus-visible), &.expanded": {
        width: `${TOOLBAR_EXPANDED_WIDTH}px`,
        zIndex: Z_INDEX.overlay,
        boxShadow: "4px 0 16px rgba(0, 0, 0, 0.12)",
        transition: `width ${RAIL_EXPAND_MOTION}, box-shadow ${RAIL_EXPAND_MOTION}`,
        ...reducedMotion({ transition: MOTION.none })
      },

      "& .toolbar-divider": {
        height: "1px",
        flexShrink: 0,
        margin: `${getSpacingPx(SPACING.md)} ${getSpacingPx(SPACING.lg)}`,
        backgroundColor: theme.vars.palette.divider
      },

      "& .MuiIconButton-root, .MuiButton-root": {
        flexShrink: 0,
        padding: `${theme.spacing(1)}`,
        margin: `0 ${theme.spacing(SPACING.xs)}`,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: "transparent",
        transition: `${MOTION.background}, color ${MOTION.fast}`,

        "& svg": {
          fontSize: "var(--fontSizeBig)",
          color: theme.vars.palette.text.secondary,
          transition: `color ${MOTION.fast}`
        },

        "&:hover": {
          backgroundColor: theme.vars.palette.action.hover,
          "& svg": {
            color: theme.vars.palette.text.primary
          }
        },

        "&.active": {
          backgroundColor: theme.vars.palette.action.selected,
          "& svg": {
            color: theme.vars.palette.text.primary
          }
        },

        "&:focus-visible": {
          outline: `2px solid ${theme.vars.palette.primary.main}`,
          outlineOffset: "-2px"
        }
      },

      "& .rail-menu-item": {
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        gap: getSpacingPx(SPACING.md),
        width: `calc(100% - ${getSpacingPx(SPACING.md)})`,
        minHeight: getSpacingPx(SPACING.xxl),
        margin: `0 ${theme.spacing(SPACING.xs)}`,
        padding: `${theme.spacing(SPACING.xs)} ${theme.spacing(SPACING.sm)}`,
        border: "none",
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: "transparent",
        color: theme.vars.palette.text.secondary,
        cursor: "pointer",
        textAlign: "left",
        overflow: "hidden",
        transition: `${MOTION.background}, color ${MOTION.fast}`,
        ...reducedMotion({ transition: MOTION.none }),

        "& .rail-menu-item-icon": {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: getSpacingPx(SPACING.xxl),
          "& svg": {
            fontSize: "var(--fontSizeBig)",
            color: "inherit",
            transition: `color ${MOTION.fast}`
          }
        },

        "& .rail-menu-item-label": {
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0,
          transition: `opacity ${RAIL_EXPAND_MOTION}`,
          ...reducedMotion({ transition: MOTION.none, opacity: 0 })
        },

        "&:hover": {
          backgroundColor: theme.vars.palette.action.hover,
          color: theme.vars.palette.text.primary
        },

        "&.active": {
          backgroundColor: theme.vars.palette.action.selected,
          color: theme.vars.palette.text.primary
        },

        "&:focus-visible": {
          outline: `2px solid ${theme.vars.palette.primary.main}`,
          outlineOffset: "-2px"
        }
      },

      "&:hover .rail-menu-item .rail-menu-item-label, &:has(:focus-visible) .rail-menu-item .rail-menu-item-label, &.expanded .rail-menu-item .rail-menu-item-label":
        {
          opacity: 1,
          ...reducedMotion({ opacity: 1 })
        }
    }
  });
