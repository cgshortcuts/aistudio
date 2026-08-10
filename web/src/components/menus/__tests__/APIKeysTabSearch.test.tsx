import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import mockTheme from "../../../__mocks__/themeMock";
import { SearchInput } from "../../ui_primitives";

jest.mock("../../../lib/env", () => ({
  isLocalhost: true,
  isElectron: true
}));
jest.mock("../../../hooks/useOAuthConnection", () => ({
  useOAuthConnection: () => ({
    label: "",
    isConnected: false,
    isConnecting: false,
    canDisconnect: false,
    connect: jest.fn(),
    disconnect: jest.fn()
  })
}));
jest.mock("../GoogleWorkspaceCard", () => () => (
  <div>Google Workspace</div>
));

const mockSecretsState = {
  secrets: [] as unknown[],
  updateSecret: jest.fn(),
  deleteSecret: jest.fn()
};
jest.mock("../../../stores/SecretsStore", () => ({
  __esModule: true,
  default: (selector: (s: typeof mockSecretsState) => unknown) =>
    selector(mockSecretsState)
}));
jest.mock("../../../stores/NotificationStore", () => ({
  useNotificationStore: (selector: (s: unknown) => unknown) =>
    selector({ addNotification: jest.fn() })
}));

import { APIKeysTabContent } from "../APIKeysTab";

function ProvidersSearchHarness() {
  const [term, setTerm] = React.useState("");
  return (
    <>
      <SearchInput
        placeholder="Search providers..."
        value={term}
        onChange={setTerm}
        size="small"
        showClear
      />
      <APIKeysTabContent searchTerm={term} />
    </>
  );
}

describe("APIKeysTabContent provider search", () => {
  it("hides the hero and get-started chrome while filtering", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={mockTheme}>
        <ProvidersSearchHarness />
      </ThemeProvider>
    );

    expect(
      screen.getByText(/Connect the AI providers you want to use/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Get started")).toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "Search providers..." }),
      "openai"
    );

    expect(
      screen.queryByText(/Connect the AI providers you want to use/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Get started")).not.toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.queryByText("Anthropic")).not.toBeInTheDocument();
  });

  it("matches section titles so Web Search providers are findable", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <APIKeysTabContent searchTerm="web search" />
      </ThemeProvider>
    );

    expect(screen.getByText("SerpAPI")).toBeInTheDocument();
    expect(screen.getByText("Brave Search")).toBeInTheDocument();
    expect(screen.queryByText("OpenAI")).not.toBeInTheDocument();
  });
});
