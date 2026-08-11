/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { memo } from "react";
import type { Theme } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import type { Workflow } from "../../stores/ApiTypes";
import {
  BORDER_RADIUS,
  FONT_WEIGHT,
  SPACING,
  TYPOGRAPHY,
  Z_INDEX,
  getSpacingPx
} from "../../components/ui_primitives";
import { isRecommendedExample } from "./isRecommended";

const badgeStyles = (theme: Theme) =>
  css({
    position: "absolute",
    top: getSpacingPx(SPACING.md),
    right: getSpacingPx(SPACING.md),
    zIndex: Z_INDEX.dropdown,
    ...TYPOGRAPHY.sans.caption,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 1.2,
    backgroundColor: theme.vars.palette.c_scrim,
    backdropFilter: "blur(4px)",
    color: theme.vars.palette.warning.main,
    border: `1px solid ${theme.vars.palette.warning.main}`,
    padding: `${getSpacingPx(SPACING.xs)} ${getSpacingPx(SPACING.md)}`,
    borderRadius: BORDER_RADIUS.pill,
    pointerEvents: "none"
  });

export interface RecommendedBadgeProps {
  workflow: Pick<Workflow, "tags">;
}

const RecommendedBadge = memo(function RecommendedBadge({
  workflow
}: RecommendedBadgeProps) {
  const theme = useTheme();
  if (!isRecommendedExample(workflow)) {
    return null;
  }
  return (
    <span css={badgeStyles(theme)} data-testid="recommended-badge">
      Recommended
    </span>
  );
});

export default RecommendedBadge;
