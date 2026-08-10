import React, { useCallback } from "react";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { useTheme } from "@mui/material/styles";
import {
  EditorButton,
  Tooltip,
  SPACING,
  getSpacingPx
} from "../../components/ui_primitives";
import {
  isFileExplorerAvailable,
  openHuggingfacePath
} from "../../utils/fileExplorer";
import { isElectron } from "../../utils/browser";
import {
  TOOLTIP_ENTER_DELAY,
  TOOLTIP_ENTER_NEXT_DELAY
} from "../../config/constants";
import { useNotificationStore } from "../../stores/NotificationStore";

/**
 * Opens the Hugging Face model cache folder (where Hub GGUF downloads land).
 * Shown in the Model Manager toolbar on desktop.
 */
export const OpenModelsFolderButton: React.FC = () => {
  const theme = useTheme();
  const show = isElectron || isFileExplorerAvailable();

  const handleClick = useCallback(() => {
    if (!isFileExplorerAvailable()) {
      useNotificationStore.getState().addNotification({
        type: "warning",
        content:
          "Open folders from the desktop app. Cache path: %USERPROFILE%\\.cache\\huggingface\\hub",
        dismissable: true
      });
      return;
    }
    void openHuggingfacePath();
  }, []);

  if (!show) {
    return null;
  }

  return (
    <Tooltip
      title="Open downloaded models folder"
      delay={TOOLTIP_ENTER_DELAY * 2}
      nextDelay={TOOLTIP_ENTER_NEXT_DELAY}
    >
      <span>
        <EditorButton
          density="compact"
          onClick={handleClick}
          aria-label="Open downloaded models folder"
          sx={{
            minWidth: "auto",
            gap: getSpacingPx(SPACING.xs),
            color: theme.vars.palette.grey[200],
            "&:hover": {
              color: theme.vars.palette.grey[0]
            }
          }}
        >
          <FolderOpenIcon sx={{ fontSize: "0.875rem" }} />
          Models folder
        </EditorButton>
      </span>
    </Tooltip>
  );
};
