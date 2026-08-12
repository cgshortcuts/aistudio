import { renderHook } from "@testing-library/react";

import { useCloseNodeMenuOnTab } from "../useCloseNodeMenuOnTab";

const dispatchTab = (init?: KeyboardEventInit) => {
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
    ...init
  });
  return window.dispatchEvent(event);
};

describe("useCloseNodeMenuOnTab", () => {
  it("closes the menu on Tab while it is open", () => {
    const closeNodeMenu = jest.fn();
    renderHook(() => useCloseNodeMenuOnTab(true, closeNodeMenu));

    expect(dispatchTab()).toBe(false);
    expect(closeNodeMenu).toHaveBeenCalledTimes(1);
  });

  it("does not close on Ctrl+Tab", () => {
    const closeNodeMenu = jest.fn();
    renderHook(() => useCloseNodeMenuOnTab(true, closeNodeMenu));

    expect(dispatchTab({ ctrlKey: true })).toBe(true);
    expect(closeNodeMenu).not.toHaveBeenCalled();
  });

  it("does not listen when the menu is closed", () => {
    const closeNodeMenu = jest.fn();
    renderHook(() => useCloseNodeMenuOnTab(false, closeNodeMenu));

    dispatchTab();
    expect(closeNodeMenu).not.toHaveBeenCalled();
  });
});
