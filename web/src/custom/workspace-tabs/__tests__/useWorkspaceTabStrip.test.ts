import { act, renderHook } from "@testing-library/react";

import { useWorkspaceTabStrip } from "../useWorkspaceTabStrip";

function makeStrip(): HTMLDivElement {
  const element = document.createElement("div");
  Object.defineProperty(element, "scrollWidth", {
    value: 800,
    configurable: true
  });
  Object.defineProperty(element, "clientWidth", {
    value: 200,
    configurable: true
  });
  element.scrollLeft = 0;
  document.body.appendChild(element);
  return element;
}

describe("useWorkspaceTabStrip", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("consumes a vertical wheel and scrolls the strip", () => {
    const strip = makeStrip();
    const ref = { current: strip };
    renderHook(() => useWorkspaceTabStrip(ref));

    const event = new WheelEvent("wheel", {
      deltaX: 0,
      deltaY: 80,
      cancelable: true
    });
    act(() => {
      strip.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(strip.scrollLeft).toBe(80);
  });

  it("cancels middle-click mousedown so the browser does not autoscroll", () => {
    const strip = makeStrip();
    const tab = document.createElement("div");
    strip.appendChild(tab);
    const ref = { current: strip };
    renderHook(() => useWorkspaceTabStrip(ref));

    const event = new MouseEvent("mousedown", {
      button: 1,
      cancelable: true,
      bubbles: true
    });
    act(() => {
      tab.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
  });

  it("does not attach listeners when disabled", () => {
    const strip = makeStrip();
    const ref = { current: strip };
    renderHook(() => useWorkspaceTabStrip(ref, false));

    const wheel = new WheelEvent("wheel", {
      deltaX: 0,
      deltaY: 80,
      cancelable: true
    });
    act(() => {
      strip.dispatchEvent(wheel);
    });

    expect(wheel.defaultPrevented).toBe(false);
    expect(strip.scrollLeft).toBe(0);
  });
});
