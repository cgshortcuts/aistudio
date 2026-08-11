import { memo, type ReactNode } from "react";

import { Tooltip, Label } from "../../components/ui_primitives";
import { TOOLTIP_ENTER_DELAY } from "../../config/constants";

export interface RailMenuItemProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  expanded?: boolean;
  active?: boolean;
  secondary?: string;
}

const RailMenuItem = memo(function RailMenuItem({
  label,
  icon,
  onClick,
  expanded = false,
  active = false,
  secondary
}: RailMenuItemProps) {
  const tooltip = secondary ? `${label} ${secondary}` : label;

  return (
    <Tooltip
      title={tooltip}
      placement="right-start"
      delay={TOOLTIP_ENTER_DELAY}
      disabled={expanded}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={tooltip}
        aria-current={active ? "page" : undefined}
        className={`rail-menu-item${active ? " active" : ""}`}
        onClick={onClick}
      >
        <span className="rail-menu-item-icon" aria-hidden>
          {icon}
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
          {secondary ? `${label} ${secondary}` : label}
        </Label>
      </button>
    </Tooltip>
  );
});

RailMenuItem.displayName = "RailMenuItem";

export default RailMenuItem;
