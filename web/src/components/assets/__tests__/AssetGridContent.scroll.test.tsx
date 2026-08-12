import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import mockTheme from "../../../__mocks__/themeMock";
import type { Asset } from "../../../stores/ApiTypes";

jest.mock("../../../serverState/useAssets", () => ({
  __esModule: true,
  default: () => ({
    folderFilesFiltered: [],
    isLoading: false,
    error: null,
    refetchAssets: jest.fn()
  })
}));

jest.mock("../../../stores/SettingsStore", () => ({
  useSettingsStore: (selector: (s: { settings: { assetItemSize: number } }) => unknown) =>
    selector({ settings: { assetItemSize: 3 } })
}));

jest.mock("../../../hooks/assets/useAssetSelection", () => ({
  useAssetSelection: () => ({
    selectedAssetIds: [],
    handleSelectAsset: jest.fn()
  })
}));

jest.mock("../../../stores/ContextMenuStore", () => ({
  __esModule: true,
  default: (selector: (s: { openContextMenu: () => void }) => unknown) =>
    selector({ openContextMenu: jest.fn() })
}));

jest.mock("../../../stores/AssetGridStore", () => ({
  useAssetGridStore: (
    selector: (s: {
      viewMode: string;
      workflowFilter: null;
      allAssetsView: boolean;
    }) => unknown
  ) => selector({ viewMode: "grid", workflowFilter: null, allAssetsView: false })
}));

jest.mock("../AssetGridRow", () => ({
  __esModule: true,
  default: () => <div data-testid="asset-row" />
}));

import AssetGridContent from "../AssetGridContent";

const asset = (id: string): Asset => ({
  id,
  name: `${id}.png`,
  content_type: "image/png",
  size: 100,
  created_at: "2023-01-01T00:00:00Z",
  parent_id: "",
  user_id: "u1",
  get_url: `/${id}.png`,
  thumb_url: `/${id}-thumb.png`,
  workflow_id: null,
  metadata: {}
});

describe("AssetGridContent scrolling", () => {
  it("scrolls the grid vertically without a horizontal scrollbar", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <AssetGridContent assets={[asset("a"), asset("b"), asset("c")]} />
      </ThemeProvider>
    );

    const scroller = screen.getByTestId("asset-grid-scroll");
    expect(scroller).toHaveStyle({ overflowX: "hidden", overflowY: "auto" });
  });
});
