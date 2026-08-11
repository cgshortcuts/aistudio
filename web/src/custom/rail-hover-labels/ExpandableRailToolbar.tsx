/** @jsxImportSource @emotion/react */
import { memo, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import CodeIcon from "@mui/icons-material/Code";

import {
  ToolbarIconButton,
  Tooltip
} from "../../components/ui_primitives";
import ThemeToggle from "../../components/ui/ThemeToggle";
import { LEFT_PANEL_TOP_LEVEL } from "../../config/quickAccessCategories";
import { useWorkflowManager } from "../../contexts/WorkflowManagerContext";
import {
  LeftPanelView,
  usePanelStore
} from "../../stores/PanelStore";
import ExpandableQuickAccessSidebar from "./ExpandableQuickAccessSidebar";
import ExpandableRailAppItems from "./ExpandableRailAppItems";
import RailAppLogo from "./RailAppLogo";
import { expandableRailToolbarStyles } from "./expandableRailToolbarStyles";
import { useRailExpand } from "./useRailExpand";

export interface ExpandableRailToolbarProps {
  activeView: string;
  onViewChange: (view: LeftPanelView) => void;
  handlePanelToggle: () => void;
  showAppMenu?: boolean;
  hiddenViews?: readonly LeftPanelView[];
}

/**
 * Fork replacement for PanelLeft's VerticalToolbar: hover/focus expands an
 * overlay rail that shows icon labels without pushing layout.
 */
const ExpandableRailToolbar = memo(function ExpandableRailToolbar({
  activeView,
  onViewChange,
  handlePanelToggle,
  showAppMenu = false,
  hiddenViews
}: ExpandableRailToolbarProps) {
  const theme = useTheme();
  const styles = useMemo(() => expandableRailToolbarStyles(theme), [theme]);
  const { railExpanded, railExpandHandlers } = useRailExpand();

  const panelVisible = usePanelStore((state) => state.panel.isVisible);
  const currentWorkflow = useWorkflowManager((state) =>
    state.currentWorkflowId
      ? state.nodeStores[state.currentWorkflowId]?.getState().getWorkflow() ??
        null
      : null
  );

  const renderedActive: LeftPanelView | "" =
    panelVisible && LEFT_PANEL_TOP_LEVEL.some((c) => c.id === activeView)
      ? (activeView as LeftPanelView)
      : "";

  const labelOverrides = useMemo(
    () => (currentWorkflow ? { assets: "Workflow Output" } : undefined),
    [currentWorkflow]
  );

  return (
    <div css={styles} className="vertical-toolbar-slot">
      <div
        className={`vertical-toolbar${railExpanded ? " expanded" : ""}`}
        {...railExpandHandlers}
      >
        {showAppMenu && (
          <>
            <RailAppLogo />
            <div className="toolbar-divider" aria-hidden />
          </>
        )}
        <div className="toolbar-scroll">
          <ExpandableQuickAccessSidebar
            activeCategory={renderedActive}
            onCategoryClick={onViewChange}
            hiddenViews={hiddenViews}
            labelOverrides={labelOverrides}
            expanded={railExpanded}
          />
          <div className="toolbar-spacer" />
          {showAppMenu && (
            <ExpandableRailAppItems expanded={railExpanded} />
          )}
        </div>
        <div className="toolbar-divider" aria-hidden />
        <ThemeToggle />
        <Tooltip title="Toggle Panel" placement="right-start">
          <ToolbarIconButton
            tabIndex={-1}
            ariaLabel="Toggle panel"
            onClick={handlePanelToggle}
            icon={<CodeIcon />}
          />
        </Tooltip>
      </div>
    </div>
  );
});

ExpandableRailToolbar.displayName = "ExpandableRailToolbar";

export default ExpandableRailToolbar;
