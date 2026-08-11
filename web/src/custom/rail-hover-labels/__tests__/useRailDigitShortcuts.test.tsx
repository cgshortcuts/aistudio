import React from "react";
import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";

import { KeyboardProvider } from "../../../components/KeyboardProvider";
import { useKeyPressedStore } from "../../../stores/KeyPressedStore";
import { useRailDigitShortcuts } from "../useRailDigitShortcuts";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <KeyboardProvider>{children}</KeyboardProvider>
);

const shiftDigit = (code: string) =>
  fireEvent.keyDown(window, {
    code,
    key: "!",
    shiftKey: true,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true
  });

describe("useRailDigitShortcuts", () => {
  afterEach(() => {
    useKeyPressedStore.getState().setPaused(false);
    document.body.innerHTML = "";
  });

  it("runs the action for the matching digit", () => {
    const first = jest.fn();
    const second = jest.fn();
    renderHook(() => useRailDigitShortcuts("shift", [first, second]), {
      wrapper
    });

    shiftDigit("Digit2");

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it("does nothing when the index is past the visible list", () => {
    const first = jest.fn();
    renderHook(() => useRailDigitShortcuts("shift", [first]), { wrapper });

    shiftDigit("Digit2");

    expect(first).not.toHaveBeenCalled();
  });

  it("ignores the combo while an input is focused", () => {
    const first = jest.fn();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useRailDigitShortcuts("shift", [first]), { wrapper });
    shiftDigit("Digit1");

    expect(first).not.toHaveBeenCalled();
  });

  it("ignores the combo while shortcuts are paused", () => {
    const first = jest.fn();
    useKeyPressedStore.getState().setPaused(true);
    renderHook(() => useRailDigitShortcuts("shift", [first]), { wrapper });

    shiftDigit("Digit1");

    expect(first).not.toHaveBeenCalled();
  });

  it("does not register when KeyboardProvider is inactive", () => {
    const first = jest.fn();
    const inactive = ({ children }: { children: React.ReactNode }) => (
      <KeyboardProvider active={false}>{children}</KeyboardProvider>
    );
    renderHook(() => useRailDigitShortcuts("shift", [first]), {
      wrapper: inactive
    });

    shiftDigit("Digit1");

    expect(first).not.toHaveBeenCalled();
  });
});
