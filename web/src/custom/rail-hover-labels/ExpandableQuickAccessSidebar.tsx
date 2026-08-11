import { memo } from "react";

import { LEFT_PANEL_TOP_LEVEL } from "../../config/quickAccessCategories";
import type { LeftPanelView } from "../../stores/PanelStore";
import { isMac } from "../../utils/platform";
import { formatRailShortcut } from "./railMenuShortcuts";
import RailMenuItem from "./RailMenuItem";
import { useRailDigitShortcuts } from "./useRailDigitShortcuts";

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
  }) => {
    const visible = LEFT_PANEL_TOP_LEVEL.filter(
      (cat) => !hiddenViews?.includes(cat.id)
    );
    const mac = isMac();
    useRailDigitShortcuts(
      "shift",
      visible.map((cat) => () => onCategoryClick(cat.id))
    );

    return (
      <>
        {visible.map((cat, index) => {
          const label = labelOverrides?.[cat.id] ?? cat.label;

          return (
            <RailMenuItem
              key={cat.id}
              label={label}
              icon={cat.icon}
              expanded={expanded}
              active={activeCategory === cat.id}
              onClick={() => onCategoryClick(cat.id)}
              shortcut={formatRailShortcut("shift", index, mac) ?? undefined}
            />
          );
        })}
      </>
    );
  }
);

ExpandableQuickAccessSidebar.displayName = "ExpandableQuickAccessSidebar";

export default ExpandableQuickAccessSidebar;
