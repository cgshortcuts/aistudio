/** @jsxImportSource @emotion/react */
import { memo, useCallback, useState } from "react";
import { Text, Tooltip } from "../../components/ui_primitives";
import { useTheme } from "@mui/material/styles";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { openInExplorer } from "../../utils/fileExplorer";
import { isElectron } from "../../utils/browser";
import type { GenerationInfoRow } from "./generationMetadataRows";

interface CopyableInfoRowProps {
  row: GenerationInfoRow;
}

/**
 * One labelled metadata row. Click copies the value (or opens the file
 * location in Explorer when `openPath` is set).
 */
export const CopyableInfoRow = memo(function CopyableInfoRow({
  row
}: CopyableInfoRowProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const copyText = row.copyValue ?? row.value;
  const isLocation = Boolean(row.openPath);

  const handleClick = useCallback(async () => {
    if (row.openPath) {
      const path = row.openPath;
      if (typeof window !== "undefined" && window.api?.showItemInFolder) {
        try {
          await window.api.showItemInFolder(path);
          return;
        } catch {
          // Fall through to openInExplorer.
        }
      }
      if (isElectron) {
        await openInExplorer(path);
        return;
      }
      // Browser: no Explorer — copy the path instead.
    }
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard denied — leave the value visible for manual select.
    }
  }, [copyText, row.openPath]);

  const canRevealInFolder =
    typeof window !== "undefined" &&
    (isElectron || Boolean(window.api?.showItemInFolder));
  const tooltip = copied
    ? "Copied"
    : isLocation
      ? canRevealInFolder
        ? "Open in File Explorer"
        : "Click to copy path"
      : "Click to copy";

  return (
    <div className="info-row">
      <Text className="info-label" component="span">
        {row.label}
      </Text>
      <Tooltip title={tooltip} placement="left">
        <button
          type="button"
          className="info-value-button"
          onClick={() => {
            void handleClick();
          }}
          style={{
            all: "unset",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "flex-start",
            gap: "0.35em",
            color: theme.vars.palette.grey[100],
            wordBreak: "break-all",
            fontSize: "inherit",
            lineHeight: 1.4,
            textAlign: "left"
          }}
        >
          <Text
            className="info-value"
            component="span"
            sx={{
              color: copied
                ? theme.vars.palette.success.main
                : theme.vars.palette.grey[100]
            }}
          >
            {row.value}
          </Text>
          {isLocation && (
            <FolderOpenIcon
              sx={{
                fontSize: "0.875rem",
                flexShrink: 0,
                mt: "0.1em",
                opacity: 0.7
              }}
            />
          )}
        </button>
      </Tooltip>
    </div>
  );
});
