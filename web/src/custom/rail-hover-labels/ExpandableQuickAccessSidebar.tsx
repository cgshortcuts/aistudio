import { memo } from "react";

import { Tooltip, Label } from "../../components/ui_primitives";
import { TOOLTIP_ENTER_DELAY } from "../../config/constants";
import { LEFT_PANEL_TOP_LEVEL } from "../../config/quickAccessCategories";
import type { LeftPanelView } from "../../stores/PanelStore";

export interface ExpandableQuickAccessSidebarProps {
  activeCategory: LeftPanelView | "";
  onCategoryClick: (id: LeftPanelView) => void;
  hiddenViews?: readonly LeftPanelView[];
  labelOverrides?: Partial<Record<LeftPanelView, string>>;
  /** When true, reveal labels and suppress per-icon tooltips. */
  expanded?: boolean;
}

/**
 * Fork rail menu: icon rows with always-mounted labels that fade in on expand.
 * Replaces upstream QuickAccessSidebar at the ExpandableRailToolbar mount.
 */
const ExpandableQuickAccessSidebar = memo<ExpandableQuickAccessSidebarProps>(
  ({
    activeCategory,
    onCategoryClick,
    hiddenViews,
    labelOverrides,
    expanded = false
  }) => (
    <>
      {LEFT_PANEL_TOP_LEVEL.filter(
        (cat) => !hiddenViews?.includes(cat.id)
      ).map((cat) => {
        const label = labelOverrides?.[cat.id] ?? cat.label;
        const isActive = activeCategory === cat.id;

        return (
          <Tooltip
            key={cat.id}
            title={label}
            placement="right-start"
            delay={TOOLTIP_ENTER_DELAY}
            disabled={expanded}
          >
            <button
              type="button"
              tabIndex={-1}
              aria-label={label}
              className={`rail-menu-item${isActive ? " active" : ""}`}
              onClick={() => onCategoryClick(cat.id)}
            >
              <span className="rail-menu-item-icon" aria-hidden>
                {cat.icon}
              </span>
              <Label
                component="span"
                size="normal"
                className="rail-menu-item-label"
                aria-hidden={!expanded}
                sx={{
                  marginBottom: 0,
                  cursor: "inherit",
                  color: "inherit",
                  display: "block"
                }}
              >
                {label}
              </Label>
            </button>
          </Tooltip>
        );
      })}
    </>
  )
);

ExpandableQuickAccessSidebar.displayName = "ExpandableQuickAccessSidebar";

export default ExpandableQuickAccessSidebar;
