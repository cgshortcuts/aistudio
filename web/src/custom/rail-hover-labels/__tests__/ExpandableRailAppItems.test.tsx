import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";

import ExpandableRailAppItems from "../ExpandableRailAppItems";
import mockTheme from "../../../__mocks__/themeMock";
import { useWorkspaceTabsStore } from "../../../stores/WorkspaceTabsStore";
import { tabId } from "../../../stores/WorkspaceTabsStore";
import { RAIL_APP_MENU_LABELS } from "../railAppMenuItems";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/workspace" })
}));

jest.mock("../../../components/content/Help/Help", () => () => null);

jest.mock("../../../stores/KeyPressedStore", () => ({
  useCombo: jest.fn()
}));

jest.mock("../../../stores/AppHeaderStore", () => ({
  useAppHeaderStore: () => ({
    helpOpen: false,
    handleCloseHelp: jest.fn(),
    handleOpenHelp: jest.fn(),
    setHelpIndex: jest.fn()
  })
}));

jest.mock("../../../stores/ModelDownloadStore", () => ({
  useModelDownloadStore: () => ({ downloads: {}, openDialog: jest.fn() })
}));

const renderItems = (expanded = true) =>
  render(
    <ThemeProvider theme={mockTheme}>
      <ExpandableRailAppItems expanded={expanded} />
    </ThemeProvider>
  );

beforeEach(() => {
  mockNavigate.mockClear();
  useWorkspaceTabsStore.setState({ tabs: [], activeTabId: null });
});

it("renders logo-menu destinations as rail buttons, not a popover", () => {
  renderItems();

  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /open app menu/i })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: RAIL_APP_MENU_LABELS.examples })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: RAIL_APP_MENU_LABELS.models })
  ).toBeInTheDocument();
});

it("opens Settings as a page tab and focuses the workspace", async () => {
  const user = userEvent.setup();
  renderItems();

  await user.click(screen.getByRole("button", { name: "Settings" }));

  const { tabs, activeTabId } = useWorkspaceTabsStore.getState();
  const expectedId = tabId("page", "settings");
  expect(tabs).toEqual([
    expect.objectContaining({
      id: expectedId,
      type: "page",
      ref: "settings",
      mode: "view",
      title: "Settings"
    })
  ]);
  expect(activeTabId).toBe(expectedId);
  expect(mockNavigate).toHaveBeenCalledWith("/workspace");
});

it("keeps Dashboard on its route (not a tab)", async () => {
  const user = userEvent.setup();
  renderItems();

  await user.click(screen.getByRole("button", { name: "Dashboard" }));

  expect(useWorkspaceTabsStore.getState().tabs).toHaveLength(0);
  expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
});

it("keeps labels aria-hidden when the rail is collapsed", () => {
  renderItems(false);

  expect(screen.getByText("Settings")).toHaveAttribute("aria-hidden", "true");
});
