import { act, renderHook } from "@testing-library/react";
import { useRef } from "react";

import { useClosePanelOnClickAway } from "../useClosePanelOnClickAway";

function dispatchPointerDown(target: EventTarget) {
  // jsdom has no PointerEvent; MouseEvent is enough for the capture listener.
  act(() => {
    target.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true, cancelable: true })
    );
  });
}

describe("useClosePanelOnClickAway", () => {
  it("calls onClose when pointerdown is outside the container", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    const onClose = jest.fn();

    renderHook(() => {
      const ref = useRef<HTMLElement | null>(container);
      useClosePanelOnClickAway(ref, { enabled: true, onClose });
    });

    dispatchPointerDown(outside);

    expect(onClose).toHaveBeenCalledTimes(1);

    container.remove();
    outside.remove();
  });

  it("does not call onClose when pointerdown is inside the container", () => {
    const container = document.createElement("div");
    const inside = document.createElement("button");
    container.appendChild(inside);
    document.body.appendChild(container);
    const onClose = jest.fn();

    renderHook(() => {
      const ref = useRef<HTMLElement | null>(container);
      useClosePanelOnClickAway(ref, { enabled: true, onClose });
    });

    dispatchPointerDown(inside);

    expect(onClose).not.toHaveBeenCalled();

    container.remove();
  });

  it("does not call onClose when pointerdown is inside a portaled overlay", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const portal = document.createElement("div");
    portal.className = "MuiPopover-root";
    const portalItem = document.createElement("button");
    portal.appendChild(portalItem);
    document.body.appendChild(portal);
    const onClose = jest.fn();

    renderHook(() => {
      const ref = useRef<HTMLElement | null>(container);
      useClosePanelOnClickAway(ref, { enabled: true, onClose });
    });

    dispatchPointerDown(portalItem);

    expect(onClose).not.toHaveBeenCalled();

    container.remove();
    portal.remove();
  });

  it("does nothing when disabled", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    const onClose = jest.fn();

    renderHook(() => {
      const ref = useRef<HTMLElement | null>(container);
      useClosePanelOnClickAway(ref, { enabled: false, onClose });
    });

    dispatchPointerDown(outside);

    expect(onClose).not.toHaveBeenCalled();

    container.remove();
    outside.remove();
  });
});
