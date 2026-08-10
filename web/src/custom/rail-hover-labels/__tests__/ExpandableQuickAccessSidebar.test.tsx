import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import mockTheme from "../../../__mocks__/themeMock";
import ExpandableQuickAccessSidebar from "../ExpandableQuickAccessSidebar";
import { LEFT_PANEL_TOP_LEVEL } from "../../../config/quickAccessCategories";

const renderSidebar = (
  props: Partial<
    React.ComponentProps<typeof ExpandableQuickAccessSidebar>
  > = {}
) =>
  render(
    <ThemeProvider theme={mockTheme}>
      <ExpandableQuickAccessSidebar
        activeCategory=""
        onCategoryClick={jest.fn()}
        {...props}
      />
    </ThemeProvider>
  );

describe("ExpandableQuickAccessSidebar", () => {
  it("keeps menu labels aria-hidden when collapsed", () => {
    renderSidebar({ expanded: false });

    for (const cat of LEFT_PANEL_TOP_LEVEL) {
      expect(screen.getByText(cat.label)).toHaveAttribute("aria-hidden", "true");
      expect(
        screen.getByRole("button", { name: cat.label })
      ).toBeInTheDocument();
    }
  });

  it("shows menu labels next to icons when expanded", () => {
    renderSidebar({ expanded: true });

    for (const cat of LEFT_PANEL_TOP_LEVEL) {
      expect(screen.getByText(cat.label)).toHaveAttribute(
        "aria-hidden",
        "false"
      );
      expect(
        screen.getByRole("button", { name: cat.label })
      ).toBeInTheDocument();
    }
  });

  it("calls onCategoryClick when a row is clicked", async () => {
    const user = userEvent.setup();
    const onCategoryClick = jest.fn();
    renderSidebar({ expanded: true, onCategoryClick });

    await user.click(screen.getByRole("button", { name: "Workflows" }));

    expect(onCategoryClick).toHaveBeenCalledWith("workflows");
  });

  it("applies labelOverrides", () => {
    renderSidebar({
      expanded: true,
      labelOverrides: { assets: "Workflow Output" }
    });

    expect(screen.getByText("Workflow Output")).toBeInTheDocument();
    expect(screen.queryByText("Assets")).not.toBeInTheDocument();
  });

  it("omits hiddenViews", () => {
    renderSidebar({ expanded: true, hiddenViews: ["nodes", "favorites"] });

    expect(screen.queryByText("Nodes")).not.toBeInTheDocument();
    expect(screen.queryByText("Favorites")).not.toBeInTheDocument();
    expect(screen.getByText("Workflows")).toBeInTheDocument();
  });
});
