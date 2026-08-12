/** @jsxImportSource @emotion/react */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { act } from "@testing-library/react";
import mockTheme from "../../../__mocks__/themeMock";
import AllAssetsNavItem from "../AllAssetsNavItem";
import { useAssetGridStore } from "../../../stores/AssetGridStore";

jest.mock("../../../stores/useAuth", () => ({
  __esModule: true,
  default: (selector: (s: { user: { id: string } }) => unknown) =>
    selector({ user: { id: "user-1" } })
}));

describe("AllAssetsNavItem", () => {
  beforeEach(() => {
    act(() => {
      useAssetGridStore.setState({
        allAssetsView: false,
        workflowFilter: null,
        selectedFolderIds: ["folder-1"],
        selectedFolderId: "folder-1",
        selectedAssetIds: [],
        selectedAssets: [],
        isGlobalSearchActive: false,
        isGlobalSearchMode: false,
        globalSearchResults: [],
        globalSearchQuery: ""
      });
    });
  });

  it("selects All and clears folder selection", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={mockTheme}>
        <AllAssetsNavItem />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", { name: "All assets" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);

    expect(useAssetGridStore.getState().allAssetsView).toBe(true);
    expect(useAssetGridStore.getState().currentFolderId).toBe("user-1");
    expect(useAssetGridStore.getState().selectedFolderIds).toEqual([]);
    expect(
      screen.getByRole("button", { name: "All assets" })
    ).toHaveAttribute("aria-pressed", "true");
  });
});
