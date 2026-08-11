/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import React, { useCallback, useRef, useState } from "react";

import Help from "../content/Help/Help";
import Logo from "../Logo";
import { Popover, MenuItemPrimitive, Tooltip, MOTION, BORDER_RADIUS, SPACING, getSpacingPx } from "../ui_primitives";
// === CUSTOM FORK START: Rail Hover Labels ===
import { useRailAppMenu } from "../../custom/rail-hover-labels/useRailAppMenu";
// === CUSTOM FORK END ===

const logoButtonStyles = (theme: Theme) =>
  css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // === CUSTOM FORK START: AiStudio Branding ===
    width: "40px",
    height: "40px",
    // === CUSTOM FORK END ===
    margin: `0 ${theme.spacing(SPACING.micro)}`,
    padding: 0,
    border: "none",
    borderRadius: BORDER_RADIUS.lg,
    background: "transparent",
    cursor: "pointer",
    opacity: 0.9,
    transition: `background-color ${MOTION.fast}, opacity ${MOTION.fast}`,
    "&:hover": {
      backgroundColor: theme.vars.palette.action.hover,
      opacity: 1
    },
    "&:focus-visible": {
      outline: `2px solid ${theme.vars.palette.primary.main}`,
      outlineOffset: "-2px"
    }
  });

const menuStyles = () =>
  css({
    minWidth: "208px",
    padding: `${getSpacingPx(SPACING.xs)} 0`
  });

export interface RailAppMenuProps {
  /**
   * Called after an item opens something (a page tab, Help, Downloads). The
   * mobile panel sheet uses it to dismiss itself so the destination isn't
   * hidden behind it.
   */
  onAction?: () => void;
}

/**
 * The app menu used on mobile (logo + popover). Desktop mounts the same
 * destinations as rail rows in ExpandableRailToolbar.
 */
const RailAppMenu: React.FC<RailAppMenuProps> = ({ onAction }) => {
  const theme = useTheme();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const finish = useCallback(() => {
    setOpen(false);
    onAction?.();
  }, [onAction]);

  // === CUSTOM FORK START: Rail Hover Labels ===
  const { items, helpOpen, handleCloseHelp } = useRailAppMenu({
    onAction: finish
  });
  // === CUSTOM FORK END ===

  return (
    <>
      <Tooltip title="Menu" placement="right-start">
        <button
          ref={anchorRef}
          type="button"
          css={logoButtonStyles(theme)}
          className="rail-app-logo"
          aria-label="Open app menu"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {/* === CUSTOM FORK START: AiStudio Branding === */}
          <Logo
            small
            width="40px"
            height="40px"
            fontSize="1em"
            borderRadius={BORDER_RADIUS.sm}
          />
          {/* === CUSTOM FORK END === */}
        </button>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={close}
        placement="bottom-left"
      >
        <div css={menuStyles()} role="menu">
          {/* === CUSTOM FORK START: Rail Hover Labels === */}
          {items.map((item) => (
            <MenuItemPrimitive
              key={item.id}
              label={item.label}
              icon={item.icon}
              onClick={item.onClick}
              secondary={item.secondary}
              dividerAfter={item.dividerAfter}
            />
          ))}
          {/* === CUSTOM FORK END === */}
        </div>
      </Popover>

      <Help open={helpOpen} handleClose={handleCloseHelp} />
    </>
  );
};

RailAppMenu.displayName = "RailAppMenu";

export default RailAppMenu;
