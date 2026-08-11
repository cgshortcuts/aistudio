import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { act } from "@testing-library/react";
import mockTheme from "../../../__mocks__/themeMock";
import StarredAssetsFilterButton from "../StarredAssetsFilterButton";
import { useFavoriteAssetsStore } from "../FavoriteAssetsStore";

describe("StarredAssetsFilterButton", () => {
  beforeEach(() => {
    act(() => {
      useFavoriteAssetsStore.setState({
        favoriteAssetIds: [],
        starredFilter: false
      });
    });
  });

  it("toggles the starred filter", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={mockTheme}>
        <StarredAssetsFilterButton />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", { name: "Show starred only" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);

    expect(useFavoriteAssetsStore.getState().starredFilter).toBe(true);
    expect(
      screen.getByRole("button", { name: "Show all assets" })
    ).toHaveAttribute("aria-pressed", "true");
  });
});
