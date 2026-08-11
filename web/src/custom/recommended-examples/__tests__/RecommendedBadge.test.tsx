import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import mockTheme from "../../../__mocks__/themeMock";
import RecommendedBadge from "../RecommendedBadge";
import RecommendedFilterButton from "../RecommendedFilterButton";

describe("RecommendedBadge", () => {
  it("renders on a recommended example", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RecommendedBadge workflow={{ tags: ["recommended", "image"] }} />
      </ThemeProvider>
    );
    expect(screen.getByTestId("recommended-badge")).toHaveTextContent(
      "Recommended"
    );
  });

  it("renders nothing on other examples", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RecommendedBadge workflow={{ tags: ["image"] }} />
      </ThemeProvider>
    );
    expect(screen.queryByTestId("recommended-badge")).not.toBeInTheDocument();
  });
});

describe("RecommendedFilterButton", () => {
  it("marks the filter as pressed when active", () => {
    const onClick = jest.fn();
    render(
      <RecommendedFilterButton active onClick={onClick} />
    );
    expect(screen.getByRole("button", { name: "Recommended" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
