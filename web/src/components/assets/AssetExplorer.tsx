/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { memo } from "react";
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";
import ManagerPageLayout from "../panels/ManagerPageLayout";
import AssetGrid from "./AssetGrid";
import StorageAnalytics from "./StorageAnalytics";
import {
  Box,
  EmptyState,
  FlexColumn,
  LoadingSpinner
} from "../ui_primitives";
import useAssets from "../../serverState/useAssets";
import { ContextMenuProvider } from "../../providers/ContextMenuProvider";

// AssetGrid sizes itself for the narrow left panel (a top margin and a
// viewport-relative dropzone height cap). On the full-screen page those caps
// leave gaps, so override them to let the grid fill the manager content area.
const gridFillStyles = css({
  "&": {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column"
  },
  ".asset-grid-container": {
    marginTop: 0,
    flex: 1,
    minHeight: 0
  },
  ".dropzone": {
    // Override the grid's viewport-relative cap so the grid fills the remaining
    // height. minHeight: 0 keeps the flex child from growing with every asset.
    maxHeight: "none !important",
    minHeight: 0,
    overflow: "hidden"
  }
});

/**
 * Full-screen Assets page. Reachable from the logo menu; wraps the asset grid
 * in the shared manager chrome (header + back button) so it stays consistent
 * with the Collections, Models, and Workspaces pages.
 */
const AssetExplorer: React.FC = memo(() => {
  const { folderFiles, folderTree, isLoading, error, refetchAssetsAndFolders } =
    useAssets();

  // Only gate the page on the true first load. Switching the workflow filter
  // flips isLoading while folderTree is already known; unmounting AssetGrid
  // then remounts it and the fullscreen default-scope effect clears the
  // selection — so the first workflow click appears to fail.
  const isInitialLoad = folderTree == null && isLoading;
  const isInitialError = folderTree == null && error != null;

  return (
    <ManagerPageLayout
      icon={<PermMediaOutlinedIcon sx={{ fontSize: 22 }} />}
      title="Assets"
      subtitle="Browse, organize, and preview your images, audio, video, and other files."
      docsTopic="assets"
      padded={false}
      actions={<StorageAnalytics assets={folderFiles} />}
    >
      <Box css={gridFillStyles}>
        {isInitialLoad ? (
          <FlexColumn justify="center" align="center" sx={{ flex: 1 }}>
            <LoadingSpinner size="large" text="Loading assets" />
          </FlexColumn>
        ) : isInitialError ? (
          <FlexColumn justify="center" align="center" sx={{ flex: 1 }}>
            <EmptyState
              variant="error"
              title="Could not load assets"
              description={error?.message || "An error occurred. Please try again."}
              actionText="Retry"
              onAction={refetchAssetsAndFolders}
            />
          </FlexColumn>
        ) : (
          <ContextMenuProvider>
            <AssetGrid
              maxItemSize={10}
              itemSpacing={2}
              isHorizontal={true}
              isFullscreenAssets={true}
              initialFoldersPanelWidth={300}
              sortedAssets={folderFiles}
            />
          </ContextMenuProvider>
        )}
      </Box>
    </ManagerPageLayout>
  );
});

AssetExplorer.displayName = "AssetExplorer";

export default AssetExplorer;
