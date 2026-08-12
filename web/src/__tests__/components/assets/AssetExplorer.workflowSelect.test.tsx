/**
 * Clicking a workflow on the Assets page must keep AssetGrid mounted.
 * Gating the page on useAssets().isLoading unmounts the grid during the
 * workflow-filter fetch; remount then clears workflowFilter via AssetGrid's
 * fullscreen default effect — first click fails, second (cache hit) sticks.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import ThemeNodetool from "../../../components/themes/ThemeNodetool";
import AssetExplorer from "../../../components/assets/AssetExplorer";

let mockAssetsState: {
  folderFiles: { id: string }[];
  folderTree: Record<string, unknown> | null;
  isLoading: boolean;
  error: Error | null;
  refetchAssetsAndFolders: jest.Mock;
};

jest.mock("../../../components/assets/AssetGrid", () => ({
  __esModule: true,
  default: () => <div data-testid="asset-grid">asset-grid</div>
}));

jest.mock("../../../serverState/useAssets", () => ({
  __esModule: true,
  default: () => mockAssetsState
}));

jest.mock("../../../contexts/WorkflowManagerContext", () => ({
  useWorkflowManager: (sel: (s: { currentWorkflowId: string }) => unknown) =>
    sel({ currentWorkflowId: "wf-1" })
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn()
}));

const renderExplorer = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={ThemeNodetool}>
        <AssetExplorer />
      </ThemeProvider>
    </MemoryRouter>
  );

describe("AssetExplorer workflow select remount", () => {
  beforeEach(() => {
    mockAssetsState = {
      folderFiles: [{ id: "a1" }],
      folderTree: { root: { id: "root" } },
      isLoading: false,
      error: null,
      refetchAssetsAndFolders: jest.fn()
    };
  });

  it("keeps AssetGrid mounted while a workflow-filter fetch is loading", () => {
    // After a workflow click, folderTree is already known; only the
    // workflow_id assets query is loading.
    mockAssetsState = {
      folderFiles: [],
      folderTree: { root: { id: "root" } },
      isLoading: true,
      error: null,
      refetchAssetsAndFolders: jest.fn()
    };

    renderExplorer();

    expect(screen.getByTestId("asset-grid")).toBeInTheDocument();
    expect(screen.queryByText("Loading assets")).not.toBeInTheDocument();
  });
});
