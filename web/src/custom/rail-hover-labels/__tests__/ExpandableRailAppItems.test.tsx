import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";

import ExpandableRailAppItems from "../ExpandableRailAppItems";
import mockTheme from "../../../__mocks__/themeMock";
import { useWorkspaceTabsStore } from "../../../stores/WorkspaceTabsStore";
import { tabId } from "../../../stores/WorkspaceTabsStore";
import {
  resetAssetSearchAutofocusStore,
  useAssetSearchAutofocusStore
} from "../../asset-search-autofocus";
import { isMac } from "../../../utils/platform";
import { RAIL_APP_MENU_LABELS } from "../railAppMenuItems";
import { formatRailShortcut } from "../railMenuShortcuts";

const rowName = (label: string) => new RegExp(`^${label}\\b`);

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/workspace" })
}));

jest.mock("../../../components/content/Help/Help", () => () => null);

jest.mock("../../../stores/KeyPressedStore", () => {
  const state = { isPaused: false };
  const useKeyPressedStore = Object.assign((selector: (s: { isPaused: boolean }) => unknown) => selector(state), {
    getState: () => state
  });
  return {
    useCombo: jest.fn(),
    useKeyPressedStore
  };
});

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
  resetAssetSearchAutofocusStore();
});

it("renders logo-menu destinations as rail buttons, not a popover", () => {
  renderItems();

  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /open app menu/i })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: rowName("Dashboard") })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", {
      name: rowName(RAIL_APP_MENU_LABELS.examples)
    })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: rowName("Settings") })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: rowName(RAIL_APP_MENU_LABELS.models) })
  ).toBeInTheDocument();
});

it("opens Settings as a page tab and focuses the workspace", async () => {
  const user = userEvent.setup();
  renderItems();

  await user.click(screen.getByRole("button", { name: rowName("Settings") }));

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

it("requests asset search focus when Assets is opened", async () => {
  const user = userEvent.setup();
  renderItems();

  await user.click(screen.getByRole("button", { name: rowName("Assets") }));

  const state = useAssetSearchAutofocusStore.getState();
  expect(state.surface).toBe("assets-page");
  expect(state.generation).toBe(1);
});

it("keeps Dashboard on its route (not a tab)", async () => {
  const user = userEvent.setup();
  renderItems();

  await user.click(screen.getByRole("button", { name: rowName("Dashboard") }));

  expect(useWorkspaceTabsStore.getState().tabs).toHaveLength(0);
  expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
});

it("keeps labels aria-hidden when the rail is collapsed", () => {
  renderItems(false);

  expect(screen.getByText("Settings")).toHaveAttribute("aria-hidden", "true");
});

it("shows an alt-digit badge on the first destination", () => {
  renderItems();
  const shortcut = formatRailShortcut("alt", 0, isMac());
  expect(
    screen.getByRole("button", { name: `Dashboard ${shortcut}` })
  ).toBeInTheDocument();
});
