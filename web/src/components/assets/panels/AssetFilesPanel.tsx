/** @jsxImportSource @emotion/react */
import React, { useCallback, useRef, memo } from "react";
import { useTheme } from "@mui/material/styles";

import { useAssetGridStore } from "../../../stores/AssetGridStore";
import { Asset, AssetWithPath } from "../../../stores/ApiTypes";
import SearchErrorBoundary from "../../SearchErrorBoundary";
import { FlexColumn } from "../../ui_primitives";
import GlobalSearchResults from "../GlobalSearchResults";
import AssetGridContent from "../AssetGridContent";
import BreadcrumbNav from "../BreadcrumbNav";

export interface AssetFilesPanelProps {
  isHorizontal?: boolean;
  itemSpacing?: number;
}
const AssetFilesPanel: React.FC<AssetFilesPanelProps> = ({
  isHorizontal,
  itemSpacing
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const setOpenAssetLocal = useAssetGridStore((state) => state.setOpenAsset);
  const isGlobalSearchActiveLocal = useAssetGridStore(
    (state) => state.isGlobalSearchActive
  );
  const isGlobalSearchModeLocal = useAssetGridStore(
    (state) => state.isGlobalSearchMode
  );
  const globalSearchResultsLocal = useAssetGridStore(
    (state) => state.globalSearchResults
  );
  const setIsGlobalSearchActiveLocal = useAssetGridStore(
    (state) => state.setIsGlobalSearchActive
  );
  const setIsGlobalSearchModeLocal = useAssetGridStore(
    (state) => state.setIsGlobalSearchMode
  );
  const setCurrentFolderIdLocal = useAssetGridStore(
    (state) => state.setCurrentFolderId
  );

  const handleDoubleClick = useCallback(
    (asset: Asset) => {
      setOpenAssetLocal(asset);
    },
    [setOpenAssetLocal]
  );

  const handleGlobalSearchAssetDoubleClick = useCallback(
    (asset: AssetWithPath) => {
      setOpenAssetLocal(asset);
    },
    [setOpenAssetLocal]
  );

  const handleNavigateToFolder = useCallback(
    (folderId: string, _folderPath: string) => {
      setCurrentFolderIdLocal(folderId);
      setIsGlobalSearchActiveLocal(false);
      setIsGlobalSearchModeLocal(false);
    },
    [
      setCurrentFolderIdLocal,
      setIsGlobalSearchActiveLocal,
      setIsGlobalSearchModeLocal
    ]
  );

  const theme = useTheme();

  return (
    <FlexColumn
      fullHeight
      className="asset-files-panel"
      sx={{
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
        backgroundColor: theme.vars.palette.c_editor_bg_color
      }}
    >
      <FlexColumn
        className={`asset-content-wrapper ${
          isGlobalSearchModeLocal && isGlobalSearchActiveLocal
            ? "global-search-mode"
            : "normal-grid-mode"
        }`}
        sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}
        ref={containerRef}
      >
        <BreadcrumbNav />
        {isGlobalSearchModeLocal && isGlobalSearchActiveLocal ? (
          <SearchErrorBoundary fallbackTitle="Search Results Error">
            <GlobalSearchResults
              results={globalSearchResultsLocal}
              onAssetDoubleClick={handleGlobalSearchAssetDoubleClick}
              onNavigateToFolder={handleNavigateToFolder}
              containerWidth={containerRef.current?.offsetWidth || 800}
            />
          </SearchErrorBoundary>
        ) : (
          <AssetGridContent
            isHorizontal={isHorizontal}
            itemSpacing={itemSpacing}
            onDoubleClick={handleDoubleClick}
          />
        )}
      </FlexColumn>
    </FlexColumn>
  );
};

AssetFilesPanel.displayName = "AssetFilesPanel";

export default memo(AssetFilesPanel);
