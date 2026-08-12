/**
 * Fullscreen AssetGrid must not wipe a manual workflowFilter on remount.
 * AssetExplorer used to unmount the grid while the workflow query loaded;
 * remount then re-ran the default-scope effect and cleared the selection.
 */
import React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import mockTheme from "../../../__mocks__/themeMock";
import { useAssetGridStore } from "../../../stores/AssetGridStore";

jest.mock("@mui/material/useMediaQuery", () => ({
  __esModule: true,
  default: () => false
}));

jest.mock("../AssetActionsMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="actions-menu" />
}));
jest.mock("../AssetViewer", () => ({ __esModule: true, default: () => null }));
jest.mock("../AssetCreateFolderConfirmation", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../AssetDeleteConfirmation", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../AssetMoveToFolderConfirmation", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../AssetRenameConfirmation", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../AssetUploadOverlay", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../ImageCompareDialog", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../panels/AssetFoldersPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="folders-panel" />
}));
jest.mock("../panels/AssetFilesPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="files-panel" />
}));
jest.mock("../../context_menus/AssetItemContextMenu", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../../context_menus/AssetGridContextMenu", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../../audio/AudioPlayer", () => ({
  __esModule: true,
  default: () => null
}));
jest.mock("../Dropzone", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

jest.mock("../../../serverState/useAssets", () => ({
  __esModule: true,
  default: () => ({
    error: null,
    folderFiles: [],
    folderFilesFiltered: [],
    folderTree: { root: { id: "root", name: "Assets", children: [] } },
    navigateToFolderId: jest.fn()
  })
}));

jest.mock("../../../serverState/useAssetUpload", () => ({
  __esModule: true,
  useAssetUpload: () => ({ uploadAsset: jest.fn(), isUploading: false })
}));

jest.mock("../../../stores/useAuth", () => ({
  __esModule: true,
  default: (selector: (s: unknown) => unknown) =>
    selector({ user: { id: "user-1" } })
}));

jest.mock("../../../contexts/WorkflowManagerContext", () => ({
  __esModule: true,
  useWorkflowManager: (selector: (s: unknown) => unknown) =>
    selector({ currentWorkflowId: null })
}));

jest.mock("../../../stores/ContextMenuStore", () => ({
  __esModule: true,
  default: (selector: (s: unknown) => unknown) =>
    selector({ openMenuType: null })
}));

jest.mock("../../../stores/KeyPressedStore", () => ({
  __esModule: true,
  useKeyPressedStore: (selector: (s: unknown) => unknown) =>
    selector({ isKeyPressed: () => false })
}));

jest.mock("../../../hooks/assets/useAssetGridShortcuts", () => ({
  __esModule: true,
  useAssetGridShortcuts: jest.fn()
}));

jest.mock("../hooks/useClickOutsideDeselect", () => ({
  __esModule: true,
  default: jest.fn()
}));

import AssetGrid from "../AssetGrid";

describe("AssetGrid workflow filter remount", () => {
  beforeEach(() => {
    useAssetGridStore.setState({
      workflowFilter: null,
      selectedFolderId: "user-1",
      selectedFolderIds: ["user-1"],
      allAssetsView: false
    });
  });

  it("preserves a manual workflowFilter across fullscreen remount", () => {
    useAssetGridStore.getState().setWorkflowFilter("wf-manual");

    const { unmount } = render(
      <ThemeProvider theme={mockTheme}>
        <AssetGrid isFullscreenAssets initialFoldersPanelWidth={300} />
      </ThemeProvider>
    );

    expect(useAssetGridStore.getState().workflowFilter).toBe("wf-manual");

    unmount();

    render(
      <ThemeProvider theme={mockTheme}>
        <AssetGrid isFullscreenAssets initialFoldersPanelWidth={300} />
      </ThemeProvider>
    );

    expect(useAssetGridStore.getState().workflowFilter).toBe("wf-manual");
  });
});
