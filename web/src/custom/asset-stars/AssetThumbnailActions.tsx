import { useCallback, memo, useMemo, type MouseEvent, type SyntheticEvent } from "react";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useTheme } from "@mui/material/styles";
import {
  BORDER_RADIUS,
  SPACING,
  ToolbarIconButton,
  getSpacingPx
} from "../../components/ui_primitives";
import { useAssetGridStoreApi } from "../../stores/AssetGridStore";
import {
  useFavoriteAssetsStore,
  useIsAssetFavorite
} from "./FavoriteAssetsStore";
import { toggleAssetInSelection } from "./toggleAssetInSelection";

export interface AssetThumbnailActionsProps {
  assetId: string;
  isSelected: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
}

const stopTileEvents = (event: SyntheticEvent) => {
  event.stopPropagation();
};

const AssetThumbnailActions: React.FC<AssetThumbnailActionsProps> = ({
  assetId,
  isSelected,
  showDelete = true,
  onDelete
}) => {
  const theme = useTheme();
  const gridStore = useAssetGridStoreApi();
  const isStarred = useIsAssetFavorite(assetId);
  const toggleFavorite = useFavoriteAssetsStore((state) => state.toggleFavorite);

  const overlayButtonSx = useMemo(
    () => ({
      width: getSpacingPx(SPACING.xxl),
      height: getSpacingPx(SPACING.xxl),
      minWidth: getSpacingPx(SPACING.xxl),
      padding: getSpacingPx(SPACING.micro),
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: theme.vars.palette.c_scrim,
      color: theme.vars.palette.grey[100],
      border: `1px solid rgb(${theme.vars.palette.common.whiteChannel} / 0.16)`,
      backdropFilter: "blur(4px)",
      "&:hover": {
        backgroundColor: theme.vars.palette.c_scrim_strong,
        color: theme.vars.palette.grey[0]
      }
    }),
    [theme]
  );

  const handleToggleSelect = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      const { selectedAssetIds, setSelectedAssetIds } = gridStore.getState();
      setSelectedAssetIds(toggleAssetInSelection(selectedAssetIds, assetId));
    },
    [assetId, gridStore]
  );

  const handleToggleStar = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      toggleFavorite(assetId);
    },
    [assetId, toggleFavorite]
  );

  const handleDelete = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onDelete?.();
    },
    [onDelete]
  );

  return (
    <div
      className="asset-thumbnail-actions"
      onClick={stopTileEvents}
      onDoubleClick={stopTileEvents}
      onMouseDown={stopTileEvents}
    >
      <ToolbarIconButton
        className={`asset-overlay-btn${isSelected ? " checked" : ""}`}
        icon={
          isSelected ? (
            <CheckBoxIcon fontSize="small" />
          ) : (
            <CheckBoxOutlineBlankIcon fontSize="small" />
          )
        }
        tooltip={isSelected ? "Deselect" : "Select"}
        tooltipPlacement="left"
        onClick={handleToggleSelect}
        aria-pressed={isSelected}
        size="small"
        nodrag={false}
        sx={overlayButtonSx}
      />
      <ToolbarIconButton
        className={`asset-overlay-btn${isStarred ? " starred" : ""}`}
        icon={
          isStarred ? (
            <StarIcon fontSize="small" />
          ) : (
            <StarBorderIcon fontSize="small" />
          )
        }
        tooltip={isStarred ? "Remove star" : "Star"}
        tooltipPlacement="left"
        onClick={handleToggleStar}
        aria-pressed={isStarred}
        size="small"
        nodrag={false}
        sx={
          isStarred
            ? { ...overlayButtonSx, color: theme.vars.palette.warning.main }
            : overlayButtonSx
        }
      />
      {showDelete && (
        <ToolbarIconButton
          className="asset-overlay-btn"
          icon={<DeleteOutlineIcon fontSize="small" />}
          tooltip="Delete"
          tooltipPlacement="left"
          onClick={handleDelete}
          size="small"
          nodrag={false}
          sx={overlayButtonSx}
        />
      )}
    </div>
  );
};

export default memo(AssetThumbnailActions);
