import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useRailExpand } from "../useRailExpand";

function RailProbe() {
  const { railExpanded, railExpandHandlers } = useRailExpand();
  return (
    <div
      data-testid="rail"
      data-expanded={railExpanded ? "true" : "false"}
      {...railExpandHandlers}
    >
      <button type="button">Nodes</button>
    </div>
  );
}

describe("useRailExpand", () => {
  it("expands on pointer enter and collapses as soon as the pointer leaves", async () => {
    const user = userEvent.setup();
    render(
      <>
        <RailProbe />
        <button type="button">Outside</button>
      </>
    );

    const rail = screen.getByTestId("rail");
    expect(rail).toHaveAttribute("data-expanded", "false");

    await user.hover(rail);
    expect(rail).toHaveAttribute("data-expanded", "true");

    await user.hover(screen.getByRole("button", { name: "Outside" }));
    expect(rail).toHaveAttribute("data-expanded", "false");
  });

  it("collapses on pointer leave even if a rail control still has focus", async () => {
    const user = userEvent.setup();
    render(
      <>
        <RailProbe />
        <button type="button">Outside</button>
      </>
    );

    const rail = screen.getByTestId("rail");
    await user.hover(rail);
    await user.click(screen.getByRole("button", { name: "Nodes" }));
    expect(screen.getByRole("button", { name: "Nodes" })).toHaveFocus();
    expect(rail).toHaveAttribute("data-expanded", "true");

    await user.hover(screen.getByRole("button", { name: "Outside" }));
    expect(rail).toHaveAttribute("data-expanded", "false");
  });

  it("stays expanded when the pointer moves to a child control", async () => {
    const user = userEvent.setup();
    render(<RailProbe />);

    const rail = screen.getByTestId("rail");
    await user.hover(rail);
    await user.hover(screen.getByRole("button", { name: "Nodes" }));

    expect(rail).toHaveAttribute("data-expanded", "true");
  });

  it("expands for keyboard focus and collapses when focus leaves the rail", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <RailProbe />
        <button type="button">Outside</button>
      </>
    );

    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Nodes" })).toHaveFocus();
    expect(screen.getByTestId("rail")).toHaveAttribute("data-expanded", "true");

    await user.tab();
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
    expect(screen.getByTestId("rail")).toHaveAttribute("data-expanded", "false");
  });
});
