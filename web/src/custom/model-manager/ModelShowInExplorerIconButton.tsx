import React from "react";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { ToolbarIconButton } from "../../components/ui_primitives";

interface ModelShowInExplorerIconButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Per-row open-folder control. Same FolderOpen glyph as the toolbar
 * "Models folder" button; ToolbarIconButton default grey matches Copy/Delete.
 */
export const ModelShowInExplorerIconButton: React.FC<
  ModelShowInExplorerIconButtonProps
> = ({ onClick, disabled }) => (
  <ToolbarIconButton
    icon={<FolderOpenIcon sx={{ fontSize: "0.875rem" }} />}
    tooltip="Show in File Explorer"
    ariaLabel="Show in File Explorer"
    onClick={onClick}
    disabled={disabled}
    size="small"
    nodrag={false}
  />
);
