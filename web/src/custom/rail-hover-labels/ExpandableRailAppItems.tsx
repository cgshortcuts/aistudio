import { memo, useMemo } from "react";
import { useLocation } from "react-router-dom";

import Help from "../../components/content/Help/Help";
import { tabId, useWorkspaceTabsStore } from "../../stores/WorkspaceTabsStore";
import type { PageTabKey } from "../../components/workspace/pageTabs";
import { isMac } from "../../utils/platform";
import RailMenuItem from "./RailMenuItem";
import { formatRailShortcut } from "./railMenuShortcuts";
import { RAIL_APP_PAGE_IDS, type RailAppMenuId } from "./railAppMenuItems";
import { useRailAppMenu } from "./useRailAppMenu";
import { useRailDigitShortcuts } from "./useRailDigitShortcuts";

export interface ExpandableRailAppItemsProps {
  expanded?: boolean;
}

const PAGE_IDS = new Set<RailAppMenuId>(RAIL_APP_PAGE_IDS);

const ExpandableRailAppItems = memo(function ExpandableRailAppItems({
  expanded = false
}: ExpandableRailAppItemsProps) {
  const { items, helpOpen, handleCloseHelp } = useRailAppMenu();
  const pathname = useLocation().pathname;
  const activeTabId = useWorkspaceTabsStore((state) => state.activeTabId);
  const mac = isMac();
  useRailDigitShortcuts(
    "alt",
    items.map((item) => item.onClick)
  );

  const activeId = useMemo(() => {
    if (pathname === "/dashboard") {
      return "dashboard";
    }
    if (!activeTabId) {
      return null;
    }
    for (const id of PAGE_IDS) {
      if (activeTabId === tabId("page", id as PageTabKey)) {
        return id;
      }
    }
    return null;
  }, [pathname, activeTabId]);

  return (
    <>
      {items.map((item, index) => (
        <RailMenuItem
          key={item.id}
          label={item.label}
          icon={item.icon}
          onClick={item.onClick}
          expanded={expanded}
          active={item.id === activeId}
          secondary={item.secondary}
          shortcut={formatRailShortcut("alt", index, mac) ?? undefined}
        />
      ))}
      <Help open={helpOpen} handleClose={handleCloseHelp} />
    </>
  );
});

ExpandableRailAppItems.displayName = "ExpandableRailAppItems";

export default ExpandableRailAppItems;
