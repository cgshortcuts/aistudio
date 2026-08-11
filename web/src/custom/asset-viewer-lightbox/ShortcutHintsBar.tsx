/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { memo } from "react";
import { useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import {
  Caption,
  FlexRow,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SPACING,
  getSpacingPx
} from "../../components/ui_primitives";

const styles = (theme: Theme) =>
  css({
    flexWrap: "wrap",
    pointerEvents: "none",
    ".hint": {
      display: "inline-flex",
      alignItems: "center",
      gap: getSpacingPx(SPACING.xs)
    },
    ".hint-label": {
      color: theme.vars.palette.text.secondary,
      whiteSpace: "nowrap"
    },
    kbd: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "1.4em",
      padding: `${getSpacingPx(SPACING.micro)} ${getSpacingPx(SPACING.sm)}`,
      height: "18px",
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: theme.vars.palette.action.hover,
      border: `1px solid ${theme.vars.palette.divider}`,
      color: theme.vars.palette.text.secondary,
      fontSize: "var(--fontSizeSmaller)",
      fontWeight: FONT_WEIGHT.semibold,
      fontFamily: theme.fontFamily2,
      lineHeight: 1,
      boxShadow: "none",
      margin: 0,
      letterSpacing: "0.02em"
    }
  });

export interface ShortcutHint {
  keys: string[];
  label: string;
}

export interface ShortcutHintsBarProps {
  hints: ShortcutHint[];
  className?: string;
}

const ShortcutHintsBar = memo(function ShortcutHintsBar({
  hints,
  className
}: ShortcutHintsBarProps) {
  const theme = useTheme();

  return (
    <FlexRow
      className={className}
      css={styles(theme)}
      gap={SPACING.lg}
      align="center"
      aria-hidden
    >
      {hints.map((hint) => (
        <span key={`${hint.label}-${hint.keys.join("+")}`} className="hint">
          {hint.keys.map((key) => (
            <kbd key={key}>{key}</kbd>
          ))}
          <Caption component="span" size="smaller" className="hint-label">
            {hint.label}
          </Caption>
        </span>
      ))}
    </FlexRow>
  );
});

ShortcutHintsBar.displayName = "ShortcutHintsBar";

export default ShortcutHintsBar;
