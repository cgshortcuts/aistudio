import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import ExpandableRailToolbar from "../ExpandableRailToolbar";
import mockTheme from "../../../__mocks__/themeMock";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/workspace" })
}));

jest.mock("../../../components/content/Help/Help", () => () => null);
jest.mock("../../../components/Logo", () => () => (
  <span data-testid="rail-logo" />
));
jest.mock("../../../components/ui/ThemeToggle", () => ({
  __esModule: true,
  default: () => <button type="button">Switch to light mode</button>
}));

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

jest.mock("../../../contexts/WorkflowManagerContext", () => ({
  useWorkflowManager: (
    selector: (state: {
      currentWorkflowId: null;
      nodeStores: Record<string, never>;
    }) => unknown
  ) => selector({ currentWorkflowId: null, nodeStores: {} })
}));

const renderToolbar = (showAppMenu = true) =>
  render(
    <ThemeProvider theme={mockTheme}>
      <ExpandableRailToolbar
        activeView="workflows"
        onViewChange={jest.fn()}
        handlePanelToggle={jest.fn()}
        showAppMenu={showAppMenu}
      />
    </ThemeProvider>
  );

it("places app destinations above the panel toggle when the app menu is shown", () => {
  renderToolbar(true);

  const dashboard = screen.getByRole("button", { name: "Dashboard" });
  const themeToggle = screen.getByRole("button", {
    name: "Switch to light mode"
  });
  const toggle = screen.getByRole("button", { name: /toggle panel/i });
  expect(
    dashboard.compareDocumentPosition(themeToggle) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    themeToggle.compareDocumentPosition(toggle) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(screen.getByTestId("rail-logo")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /open app menu/i })
  ).not.toBeInTheDocument();
});

it("omits app destinations when showAppMenu is false", () => {
  renderToolbar(false);

  expect(
    screen.queryByRole("button", { name: "Dashboard" })
  ).not.toBeInTheDocument();
  expect(screen.queryByTestId("rail-logo")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /toggle panel/i })
  ).toBeInTheDocument();
});
