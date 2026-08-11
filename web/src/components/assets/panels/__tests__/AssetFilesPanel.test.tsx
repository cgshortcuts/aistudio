import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import mockTheme from "../../../../__mocks__/themeMock";

jest.mock("../../BreadcrumbNav", () => ({
  __esModule: true,
  default: () => <div data-testid="breadcrumbs" />
}));

jest.mock("../../AssetGridContent", () => ({
  __esModule: true,
  default: () => <div data-testid="asset-grid-content" />
}));

jest.mock("../../../../stores/AssetGridStore", () => ({
  useAssetGridStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setOpenAsset: jest.fn(),
      isGlobalSearchActive: false,
      isGlobalSearchMode: false,
      globalSearchResults: [],
      setIsGlobalSearchActive: jest.fn(),
      setIsGlobalSearchMode: jest.fn(),
      setCurrentFolderId: jest.fn()
    })
}));

import AssetFilesPanel from "../AssetFilesPanel";

describe("AssetFilesPanel", () => {
  it("keeps overflow inside the panel so the page does not grow a scrollbar", () => {
    const { container } = render(
      <ThemeProvider theme={mockTheme}>
        <AssetFilesPanel />
      </ThemeProvider>
    );

    expect(screen.getByTestId("asset-grid-content")).toBeInTheDocument();
    const panel = container.querySelector(".asset-files-panel");
    expect(panel).toHaveStyle({ overflow: "hidden" });
  });
});
