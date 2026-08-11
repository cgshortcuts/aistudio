import { renderHook } from "@testing-library/react";

import { usePreventAltMenuActivation } from "../usePreventAltMenuActivation";

function dispatchKeyDown(init: KeyboardEventInit, target: EventTarget = window) {
  const event = new KeyboardEvent("keydown", {
    ...init,
    cancelable: true,
    bubbles: true
  });
  target.dispatchEvent(event);
  return event;
}

describe("usePreventAltMenuActivation", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("prevents the default Alt keydown on the window", () => {
    const { unmount } = renderHook(() => usePreventAltMenuActivation());

    const event = dispatchKeyDown({ key: "Alt" });

    expect(event.defaultPrevented).toBe(true);
    unmount();
  });

  it("does not prevent Alt inside an input", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    const { unmount } = renderHook(() => usePreventAltMenuActivation());

    const event = dispatchKeyDown({ key: "Alt" }, input);

    expect(event.defaultPrevented).toBe(false);
    unmount();
  });

  it("does nothing when disabled", () => {
    const { unmount } = renderHook(() => usePreventAltMenuActivation(false));

    const event = dispatchKeyDown({ key: "Alt" });

    expect(event.defaultPrevented).toBe(false);
    unmount();
  });
});
