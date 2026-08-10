import React, { memo, useCallback } from "react";
import Check from "@mui/icons-material/Check";
import {
  BORDER_RADIUS,
  Chip,
  CopyButton,
  DeleteButton,
  EditorButton,
  LoadingSpinner,
  Tooltip,
  Box,
  SPACING,
  getSpacingPx
} from "../../ui_primitives";
import DownloadIcon from "@mui/icons-material/Download";

import {
  HuggingFaceLink,
  OllamaLink
} from "../ModelActionsCommon";
import { UnifiedModel } from "../../../stores/ApiTypes";
import {
  TOOLTIP_ENTER_DELAY,
  TOOLTIP_ENTER_NEXT_DELAY
} from "../../../config/constants";
import { isElectron } from "../../../utils/browser";
// === CUSTOM FORK START: model-manager ===
import {
  hubRepoIdForModel,
  ModelShowInExplorerIconButton
} from "../../../custom/model-manager";
import { isFileExplorerAvailable } from "../../../utils/fileExplorer";
// === CUSTOM FORK END ===

interface ModelListItemActionsProps {
  model: UnifiedModel;
  onDownload?: () => void;
  onSelect?: () => void;
  handleModelDelete?: (modelId: string) => void;
  handleShowInExplorer?: (modelId: string) => void;
  showFileExplorerButton?: boolean;
  isCheckingCache?: boolean;
}

export const ModelListItemActions: React.FC<ModelListItemActionsProps> = ({
  model,
  onDownload,
  onSelect,
  handleModelDelete,
  handleShowInExplorer,
  showFileExplorerButton = true,
  isCheckingCache = false
}) => {
  const isHuggingFace = model.type?.startsWith("hf") ?? false;
  const isOllama = model.type === "llama_model";
  const downloaded = model.downloaded ?? false;
  // === CUSTOM FORK START: model-manager ===
  const hubRepoId = hubRepoIdForModel(model);
  // Show folder actions whenever the desktop bridge is present (including
  // packaged builds). Upstream hid this behind !isProduction.
  const canOpenFolder =
    isFileExplorerAvailable() || (isElectron && Boolean(handleShowInExplorer));
  // === CUSTOM FORK END ===
  const canShowExplorerButton = Boolean(
    handleShowInExplorer && showFileExplorerButton && canOpenFolder
  );
  const explorerButtonDisabled = !isOllama && !model.path && !model.cache_path;

  const handleChipClick = useCallback(() => {
    if (handleShowInExplorer) {
      handleShowInExplorer(model.id);
    }
  }, [handleShowInExplorer, model.id]);

  const handleShowInExplorerClick = useCallback(() => {
    if (handleShowInExplorer) {
      handleShowInExplorer(model.id);
    }
  }, [handleShowInExplorer, model.id]);

  const handleDeleteClick = useCallback(() => {
    if (handleModelDelete) {
      handleModelDelete(model.id);
    }
  }, [handleModelDelete, model.id]);

  const handleSelectClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect?.();
    },
    [onSelect]
  );

  return (
    <div className="actions-container" onClick={(e) => e.stopPropagation()}>
      {isCheckingCache && !downloaded && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5em",
            padding: `${getSpacingPx(SPACING.micro)} ${getSpacingPx(SPACING.md)}`,
            borderRadius: BORDER_RADIUS.pill,
            border: "1px solid",
            borderColor: "divider",
            color: "text.secondary",
            fontSize: "var(--fontSizeSmall)"
          }}
        >
          <LoadingSpinner inline size={12} thickness={5} color="inherit" />
          Checking cache…
        </Box>
      )}
      {onDownload && !downloaded && !isCheckingCache && (
        <EditorButton
          className="model-download-button"
          onClick={onDownload}
          variant="outlined"
          startIcon={<DownloadIcon sx={{ fontSize: "1.25em" }} />}
        >
          Download
        </EditorButton>
      )}
      {downloaded && onSelect && (
        <EditorButton
          className="model-select-button"
          onClick={handleSelectClick}
          variant="contained"
          startIcon={<Check sx={{ fontSize: "1.25em" }} />}
        >
          Use
        </EditorButton>
      )}
      {downloaded && !onSelect && (
        <Tooltip
          title={
            // === CUSTOM FORK START: model-manager ===
            canShowExplorerButton ? "Show in Explorer" : "Downloaded"
            // === CUSTOM FORK END ===
          }
          delay={TOOLTIP_ENTER_DELAY * 2}
          nextDelay={TOOLTIP_ENTER_NEXT_DELAY}
        >
          <Chip
            label="Downloaded"
            color="success"
            variant="outlined"
            size="small"
            icon={<Check fontSize="small" />}
            sx={{
              fontWeight: 600,
              cursor: canShowExplorerButton ? "pointer" : "default"
            }}
            onClick={canShowExplorerButton ? handleChipClick : undefined}
            clickable={canShowExplorerButton}
          />
        </Tooltip>
      )}

      <div className="model-actions">
        <CopyButton
          value={
            // === CUSTOM FORK START: model-manager ===
            hubRepoId ?? model.id
            // === CUSTOM FORK END ===
          }
          tooltip={isOllama ? "Copy model name" : "Copy repo ID"}
          nodrag={false}
        />
        {/* === CUSTOM FORK START: model-manager === */}
        {canShowExplorerButton && (
          <ModelShowInExplorerIconButton
            onClick={handleShowInExplorerClick}
            disabled={explorerButtonDisabled}
          />
        )}
        {/* === CUSTOM FORK END === */}
        {handleModelDelete && (
          <DeleteButton
            onClick={handleDeleteClick}
            tooltip="Delete model"
          />
        )}
      </div>
      <div className="model-link">
        {/* === CUSTOM FORK START: model-manager === */}
        {isHuggingFace && hubRepoId && (
          <HuggingFaceLink modelId={hubRepoId} />
        )}
        {/* === CUSTOM FORK END === */}
        {isOllama && <OllamaLink modelId={model.id} />}
      </div>
    </div>
  );
};

export default memo(ModelListItemActions);
