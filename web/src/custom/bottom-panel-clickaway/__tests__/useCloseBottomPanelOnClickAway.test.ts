import { act, renderHook } from "@testing-library/react";

import { useBottomPanelStore } from "../../../stores/BottomPanelStore";
import { useCloseBottomPanelOnClickAway } from "../useCloseBottomPanelOnClickAway";

function dispatchPointerDown(target: EventTarget) {
  act(() => {
    target.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true, cancelable: true })
    );
  });
}

describe("useCloseBottomPanelOnClickAway", () => {
  beforeEach(() => {
    useBottomPanelStore.getState().setVisibility(true);
  });

  it("closes the bottom panel when pointerdown is outside", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    const ref = { current: container };
    renderHook(() => useCloseBottomPanelOnClickAway(ref));

    dispatchPointerDown(outside);

    expect(useBottomPanelStore.getState().panel.isVisible).toBe(false);

    container.remove();
    outside.remove();
  });

  it("does nothing when the panel is already hidden", () => {
    useBottomPanelStore.getState().setVisibility(false);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    const ref = { current: container };
    renderHook(() => useCloseBottomPanelOnClickAway(ref));

    dispatchPointerDown(outside);

    expect(useBottomPanelStore.getState().panel.isVisible).toBe(false);

    container.remove();
    outside.remove();
  });
});
