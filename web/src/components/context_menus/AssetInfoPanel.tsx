/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { memo, useMemo } from "react";
import { Box, BORDER_RADIUS, SPACING, getSpacingPx } from "../ui_primitives";
import { useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import type { Asset } from "../../stores/ApiTypes";
import {
  formatContentType,
  formatDateTime,
  formatFileSize
} from "../../utils/formatUtils";
import { secondsToHMS } from "../../utils/formatDateAndTime";
import { useAssetGridStore } from "../../stores/AssetGridStore";
import { useWorkflowManager } from "../../contexts/WorkflowManagerContext";
// === CUSTOM FORK START: asset-generation-info ===
import {
  CopyableInfoRow,
  GenerationInfoSection
} from "../../custom/asset-generation-info";
// === CUSTOM FORK END ===

const styles = (theme: Theme) =>
  css({
    width: "280px",
    maxHeight: "70vh",
    overflowY: "auto",
    padding: "0.75em 1em",
    borderLeft: `1px solid ${theme.vars.palette.grey[700]}`,
    "& .info-row": {
      display: "flex",
      gap: "0.5em",
      padding: `${getSpacingPx(SPACING.micro)} 0`,
      alignItems: "baseline",
      lineHeight: 1.4
    },
    "& .info-label": {
      fontSize: theme.fontSizeSmaller,
      color: theme.vars.palette.grey[400],
      flexShrink: 0,
      minWidth: "70px",
      textAlign: "right"
    },
    "& .info-value": {
      fontSize: theme.fontSizeSmaller,
      color: theme.vars.palette.grey[100],
      wordBreak: "break-all"
    },
    "& .info-thumb": {
      width: "100%",
      maxHeight: "140px",
      objectFit: "contain",
      borderRadius: BORDER_RADIUS.sm,
      marginBottom: "0.5em",
      backgroundColor: theme.vars.palette.grey[800]
    },
    "& .info-section": {
      borderTop: `1px solid ${theme.vars.palette.grey[700]}`,
      marginTop: "0.35em",
      paddingTop: "0.35em"
    }
  });

interface AssetInfoPanelProps {
  asset: Asset;
}

const AssetInfoPanel: React.FC<AssetInfoPanelProps> = ({ asset }) => {
  const theme = useTheme();
  const currentFolder = useAssetGridStore((state) => state.currentFolder);
  const getWorkflow = useWorkflowManager((state) => state.getWorkflow);

  const folderName = useMemo(() => {
    if (!asset.parent_id) {
      return null;
    }
    if (currentFolder && currentFolder.id === asset.parent_id) {
      return currentFolder.name;
    }
    return asset.parent_id;
  }, [asset.parent_id, currentFolder]);

  const workflowName = useMemo(() => {
    if (!asset.workflow_id) {
      return null;
    }
    const wf = getWorkflow(asset.workflow_id);
    return wf?.name || asset.workflow_id;
  }, [asset.workflow_id, getWorkflow]);

  const isImage = asset.content_type?.startsWith("image/");
  const thumbSrc = asset.thumb_url || (isImage ? asset.get_url : null);

  return (
    <Box css={styles(theme)}>
      {thumbSrc && (
        <img className="info-thumb" src={thumbSrc} alt="" loading="eager" />
      )}

      <CopyableInfoRow row={{ label: "Name", value: asset.name }} />
      {asset.content_type && (
        <CopyableInfoRow
          row={{
            label: "Type",
            value: formatContentType(asset.content_type),
            copyValue: asset.content_type
          }}
        />
      )}
      {asset.size != null && asset.size > 0 && (
        <CopyableInfoRow
          row={{
            label: "Size",
            value: formatFileSize(asset.size),
            copyValue: String(asset.size)
          }}
        />
      )}
      {asset.duration != null && asset.duration > 0 && (
        <CopyableInfoRow
          row={{
            label: "Duration",
            value: secondsToHMS(asset.duration),
            copyValue: String(asset.duration)
          }}
        />
      )}
      <CopyableInfoRow
        row={{
          label: "Created",
          value: formatDateTime(asset.created_at),
          copyValue: asset.created_at
        }}
      />

      {(folderName || workflowName) && (
        <div className="info-section">
          {folderName && (
            <CopyableInfoRow row={{ label: "Folder", value: folderName }} />
          )}
          {workflowName && (
            <CopyableInfoRow row={{ label: "Workflow", value: workflowName }} />
          )}
        </div>
      )}

      {/* === CUSTOM FORK START: asset-generation-info === */}
      <GenerationInfoSection asset={asset} />
      {/* === CUSTOM FORK END === */}

      <div className="info-section">
        <CopyableInfoRow row={{ label: "ID", value: asset.id }} />
      </div>
    </Box>
  );
};

export default memo(AssetInfoPanel);
