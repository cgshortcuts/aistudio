import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { act } from "@testing-library/react";
import type { ComponentProps } from "react";
import mockTheme from "../../../__mocks__/themeMock";
import AssetThumbnailActions from "../AssetThumbnailActions";
import { useFavoriteAssetsStore } from "../FavoriteAssetsStore";

const mockSetSelectedAssetIds = jest.fn();
let selectedIds: string[] = [];

jest.mock("../../../stores/AssetGridStore", () => ({
  useAssetGridStoreApi: () => ({
    getState: () => ({
      selectedAssetIds: selectedIds,
      setSelectedAssetIds: mockSetSelectedAssetIds
    })
  })
}));

const renderActions = (
  props: Partial<ComponentProps<typeof AssetThumbnailActions>> = {}
) =>
  render(
    <ThemeProvider theme={mockTheme}>
      <AssetThumbnailActions
        assetId="asset-1"
        isSelected={false}
        onDelete={jest.fn()}
        {...props}
      />
    </ThemeProvider>
  );

describe("AssetThumbnailActions", () => {
  beforeEach(() => {
    selectedIds = [];
    mockSetSelectedAssetIds.mockReset();
    act(() => {
      useFavoriteAssetsStore.setState({
        favoriteAssetIds: [],
        starredFilter: false
      });
    });
  });

  it("renders select, star, and delete actions", () => {
    renderActions();

    expect(screen.getByRole("button", { name: "Select" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Star" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("toggles selection without replacing the current set", async () => {
    const user = userEvent.setup();
    selectedIds = ["other"];
    renderActions();

    await user.click(screen.getByRole("button", { name: "Select" }));

    expect(mockSetSelectedAssetIds).toHaveBeenCalledWith(["other", "asset-1"]);
  });

  it("stars the asset and shows the orange control", async () => {
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByRole("button", { name: "Star" }));

    expect(useFavoriteAssetsStore.getState().favoriteAssetIds).toEqual([
      "asset-1"
    ]);
    expect(screen.getByRole("button", { name: "Remove star" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("calls onDelete when the bin is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    renderActions({ onDelete });

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("hides delete when showDelete is false", () => {
    renderActions({ showDelete: false });

    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Star" })).toBeInTheDocument();
  });
});
