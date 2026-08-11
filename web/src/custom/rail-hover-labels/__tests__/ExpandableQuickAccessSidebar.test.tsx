import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";

import { KeyboardProvider } from "../../../components/KeyboardProvider";
import mockTheme from "../../../__mocks__/themeMock";
import { LEFT_PANEL_TOP_LEVEL } from "../../../config/quickAccessCategories";
import { isMac } from "../../../utils/platform";
import ExpandableQuickAccessSidebar from "../ExpandableQuickAccessSidebar";
import { formatRailShortcut } from "../railMenuShortcuts";

const rowName = (label: string) => new RegExp(`^${label}\\b`);

const renderSidebar = (
  props: Partial<
    React.ComponentProps<typeof ExpandableQuickAccessSidebar>
  > = {},
  keyboard = false
) => {
  const tree = (
    <ThemeProvider theme={mockTheme}>
      <ExpandableQuickAccessSidebar
        activeCategory=""
        onCategoryClick={jest.fn()}
        {...props}
      />
    </ThemeProvider>
  );
  return render(keyboard ? <KeyboardProvider>{tree}</KeyboardProvider> : tree);
};

describe("ExpandableQuickAccessSidebar", () => {
  it("keeps menu labels aria-hidden when collapsed", () => {
    renderSidebar({ expanded: false });

    for (const cat of LEFT_PANEL_TOP_LEVEL) {
      expect(screen.getByText(cat.label)).toHaveAttribute("aria-hidden", "true");
      expect(
        screen.getByRole("button", { name: rowName(cat.label) })
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
        screen.getByRole("button", { name: rowName(cat.label) })
      ).toBeInTheDocument();
    }
  });

  it("calls onCategoryClick when a row is clicked", async () => {
    const user = userEvent.setup();
    const onCategoryClick = jest.fn();
    renderSidebar({ expanded: true, onCategoryClick });

    await user.click(screen.getByRole("button", { name: rowName("Workflows") }));

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

  it("shows shift-digit badges for the first ten visible rows", () => {
    renderSidebar({ expanded: true });
    const mac = isMac();

    LEFT_PANEL_TOP_LEVEL.forEach((cat, index) => {
      const shortcut = formatRailShortcut("shift", index, mac);
      if (shortcut) {
        expect(
          screen.getByRole("button", { name: `${cat.label} ${shortcut}` })
        ).toBeInTheDocument();
      } else {
        expect(
          screen.getByRole("button", { name: cat.label })
        ).toBeInTheDocument();
      }
    });
  });

  it("renumbers shift shortcuts after hiddenViews", () => {
    renderSidebar({
      expanded: true,
      hiddenViews: ["nodes", "favorites"]
    });

    const shortcut = formatRailShortcut("shift", 0, isMac());
    expect(
      screen.getByRole("button", { name: `Workflows ${shortcut}` })
    ).toBeInTheDocument();
  });

  it("opens a row from Shift+digit", () => {
    const onCategoryClick = jest.fn();
    renderSidebar({ expanded: true, onCategoryClick }, true);

    fireEvent.keyDown(window, {
      code: "Digit2",
      key: "!",
      shiftKey: true,
      bubbles: true,
      cancelable: true
    });

    expect(onCategoryClick).toHaveBeenCalledWith("workflows");
  });
});
