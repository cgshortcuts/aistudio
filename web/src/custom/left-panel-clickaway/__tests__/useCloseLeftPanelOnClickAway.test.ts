import { act, renderHook } from "@testing-library/react";

import { usePanelStore } from "../../../stores/PanelStore";
import { useCloseLeftPanelOnClickAway } from "../useCloseLeftPanelOnClickAway";

function dispatchPointerDown(target: EventTarget) {
  act(() => {
    target.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true, cancelable: true })
    );
  });
}

describe("useCloseLeftPanelOnClickAway", () => {
  beforeEach(() => {
    usePanelStore.getState().setVisibility(true);
  });

  it("closes the left panel when pointerdown is outside", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    const ref = { current: container };
    renderHook(() => useCloseLeftPanelOnClickAway(ref));

    dispatchPointerDown(outside);

    expect(usePanelStore.getState().panel.isVisible).toBe(false);

    container.remove();
    outside.remove();
  });

  it("does nothing when the panel is already hidden", () => {
    usePanelStore.getState().setVisibility(false);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    const ref = { current: container };
    renderHook(() => useCloseLeftPanelOnClickAway(ref));

    dispatchPointerDown(outside);

    expect(usePanelStore.getState().panel.isVisible).toBe(false);

    container.remove();
    outside.remove();
  });
});
