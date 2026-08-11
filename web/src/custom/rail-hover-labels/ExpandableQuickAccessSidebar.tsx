import { memo } from "react";

import { LEFT_PANEL_TOP_LEVEL } from "../../config/quickAccessCategories";
import type { LeftPanelView } from "../../stores/PanelStore";
import RailMenuItem from "./RailMenuItem";

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

        return (
          <RailMenuItem
            key={cat.id}
            label={label}
            icon={cat.icon}
            expanded={expanded}
            active={activeCategory === cat.id}
            onClick={() => onCategoryClick(cat.id)}
          />
        );
      })}
    </>
  )
);

ExpandableQuickAccessSidebar.displayName = "ExpandableQuickAccessSidebar";

export default ExpandableQuickAccessSidebar;
