import { memo, type ReactNode } from "react";

import { Caption, Tooltip, Label } from "../../components/ui_primitives";
import { TOOLTIP_ENTER_DELAY } from "../../config/constants";

export interface RailMenuItemProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  expanded?: boolean;
  active?: boolean;
  secondary?: string;
  shortcut?: string;
}

const RailMenuItem = memo(function RailMenuItem({
  label,
  icon,
  onClick,
  expanded = false,
  active = false,
  secondary,
  shortcut
}: RailMenuItemProps) {
  const title = [label, secondary].filter(Boolean).join(" ");
  const tooltip = shortcut ? `${title} ${shortcut}` : title;

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
          {title}
        </Label>
        {shortcut ? (
          <Caption
            component="span"
            size="smaller"
            color="muted"
            className="rail-menu-item-shortcut"
            aria-hidden
            sx={{ marginBottom: 0 }}
          >
            {shortcut}
          </Caption>
        ) : null}
      </button>
    </Tooltip>
  );
});

RailMenuItem.displayName = "RailMenuItem";

export default RailMenuItem;
