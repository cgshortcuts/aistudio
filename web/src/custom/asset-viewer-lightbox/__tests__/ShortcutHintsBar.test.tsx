import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import mockTheme from "../../../__mocks__/themeMock";
import ShortcutHintsBar from "../ShortcutHintsBar";

describe("ShortcutHintsBar", () => {
  it("renders key badges and labels", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <ShortcutHintsBar
          hints={[
            { keys: ["←"], label: "Prev" },
            { keys: ["Space"], label: "Play/Pause" }
          ]}
        />
      </ThemeProvider>
    );

    expect(screen.getByText("←")).toBeInTheDocument();
    expect(screen.getByText("Prev")).toBeInTheDocument();
    expect(screen.getByText("Space")).toBeInTheDocument();
    expect(screen.getByText("Play/Pause")).toBeInTheDocument();
  });
});
