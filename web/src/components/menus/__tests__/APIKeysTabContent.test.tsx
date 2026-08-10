import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import mockTheme from "../../../__mocks__/themeMock";

import { useOAuthConnection } from "../../../hooks/useOAuthConnection";
import type { SecretResponse } from "../../../stores/ApiTypes";

// Hosted deployment: neither the browser nor the server is local.
jest.mock("../../../lib/env", () => ({
  isLocalhost: false,
  isElectron: false
}));
jest.mock("../../../hooks/useOAuthConnection");
jest.mock("../GoogleWorkspaceCard", () => () => null);

const mockSecretsState = {
  secrets: [] as SecretResponse[],
  updateSecret: jest.fn(),
  deleteSecret: jest.fn()
};

jest.mock("../../../stores/SecretsStore", () => ({
  __esModule: true,
  default: (selector: (state: typeof mockSecretsState) => unknown) =>
    selector(mockSecretsState)
}));
jest.mock("../../../stores/NotificationStore", () => ({
  useNotificationStore: (selector: (state: unknown) => unknown) =>
    selector({ addNotification: jest.fn() })
}));

// Imported after the mocks so the module picks up the hosted-env values.
import { APIKeysTabContent } from "../APIKeysTab";

const placeholder = (key: string): SecretResponse =>
  ({
    key,
    is_configured: false,
    description: "",
    user_id: null,
    created_at: null,
    updated_at: null
  }) as SecretResponse;

const configured = (key: string): SecretResponse =>
  ({
    ...placeholder(key),
    is_configured: true
  }) as SecretResponse;

describe("APIKeysTabContent on a hosted deployment", () => {
  beforeEach(() => {
    mockSecretsState.secrets = [];
    (useOAuthConnection as jest.MockedFunction<typeof useOAuthConnection>)
      .mockReturnValue({
        label: "",
        isConnected: false,
        isConnecting: false,
        canDisconnect: false,
        connect: jest.fn(),
        disconnect: jest.fn()
      });
  });

  it("hides the Claude subscription card, whose sign-in needs a local server", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <APIKeysTabContent />
      </ThemeProvider>
    );

    expect(
      screen.queryByRole("button", { name: /sign in with claude/i })
    ).not.toBeInTheDocument();
    // The API-key providers are unaffected.
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
  });

  it("does not mark multi-field providers Connected from registry placeholders", () => {
    // settings.secrets.list returns every registered key, including empty
    // placeholders. Presence alone must not count as configured.
    mockSecretsState.secrets = [
      placeholder("GOOGLE_MAIL_USER"),
      placeholder("GOOGLE_APP_PASSWORD"),
      placeholder("DATA_FOR_SEO_LOGIN"),
      placeholder("DATA_FOR_SEO_PASSWORD"),
      placeholder("GITHUB_CLIENT_ID"),
      placeholder("GITHUB_CLIENT_SECRET")
    ];

    render(
      <ThemeProvider theme={mockTheme}>
        <APIKeysTabContent />
      </ThemeProvider>
    );

    expect(screen.queryByText("Connected Providers")).not.toBeInTheDocument();
    expect(screen.getByText("Google Mail")).toBeInTheDocument();
    expect(screen.getByText("DataForSEO")).toBeInTheDocument();
    expect(screen.getByText("GitHub OAuth App")).toBeInTheDocument();
    // Connect is the unconfigured action; Manage only appears when stored.
    expect(screen.getAllByRole("button", { name: /^connect$/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /^manage$/i })).not.toBeInTheDocument();
  });

  it("shows multi-field providers under Connected when every field is stored", () => {
    mockSecretsState.secrets = [
      configured("GOOGLE_MAIL_USER"),
      configured("GOOGLE_APP_PASSWORD")
    ];

    render(
      <ThemeProvider theme={mockTheme}>
        <APIKeysTabContent />
      </ThemeProvider>
    );

    expect(screen.getByText("Connected Providers")).toBeInTheDocument();
    expect(screen.getByText("Google Mail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^manage$/i })).toBeInTheDocument();
  });
});
