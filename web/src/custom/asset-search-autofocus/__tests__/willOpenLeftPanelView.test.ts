import { willOpenLeftPanelView } from "../willOpenLeftPanelView";

describe("willOpenLeftPanelView", () => {
  it("opens when switching to a different view", () => {
    expect(
      willOpenLeftPanelView(
        { activeView: "workflows", isVisible: true },
        "library"
      )
    ).toBe(true);
  });

  it("opens when the same view is hidden", () => {
    expect(
      willOpenLeftPanelView(
        { activeView: "library", isVisible: false },
        "library"
      )
    ).toBe(true);
  });

  it("does not open when the same view is already visible", () => {
    expect(
      willOpenLeftPanelView(
        { activeView: "library", isVisible: true },
        "library"
      )
    ).toBe(false);
  });
});
