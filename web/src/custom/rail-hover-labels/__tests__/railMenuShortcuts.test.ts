import {
  formatRailShortcut,
  matchRailDigitShortcut,
  railIndexFromCode,
  railShortcutDigit
} from "../railMenuShortcuts";

const keyEvent = (
  overrides: Partial<
    Pick<
      KeyboardEvent,
      | "code"
      | "repeat"
      | "shiftKey"
      | "altKey"
      | "ctrlKey"
      | "metaKey"
      | "defaultPrevented"
    >
  >
) => ({
  code: "Digit1",
  repeat: false,
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  defaultPrevented: false,
  ...overrides
});

describe("railIndexFromCode", () => {
  it("maps Digit1–Digit9 then Digit0", () => {
    expect(railIndexFromCode("Digit1")).toBe(0);
    expect(railIndexFromCode("Digit9")).toBe(8);
    expect(railIndexFromCode("Digit0")).toBe(9);
  });

  it("ignores numpad and other keys", () => {
    expect(railIndexFromCode("Numpad1")).toBeNull();
    expect(railIndexFromCode("KeyA")).toBeNull();
  });
});

describe("railShortcutDigit", () => {
  it("uses 1–9 then 0, and skips indexes past 9", () => {
    expect(railShortcutDigit(0)).toBe("1");
    expect(railShortcutDigit(8)).toBe("9");
    expect(railShortcutDigit(9)).toBe("0");
    expect(railShortcutDigit(10)).toBeNull();
    expect(railShortcutDigit(-1)).toBeNull();
  });
});

describe("formatRailShortcut", () => {
  it("formats shift as a compact glyph on every platform", () => {
    expect(formatRailShortcut("shift", 0, false)).toBe("⇧1");
    expect(formatRailShortcut("shift", 9, true)).toBe("⇧0");
  });

  it("formats alt as Alt+N on Windows and ⌥N on Mac", () => {
    expect(formatRailShortcut("alt", 1, false)).toBe("Alt+2");
    expect(formatRailShortcut("alt", 1, true)).toBe("⌥2");
  });

  it("returns null when the row has no digit", () => {
    expect(formatRailShortcut("shift", 10, false)).toBeNull();
  });
});

describe("matchRailDigitShortcut", () => {
  it("matches shift+digit without other modifiers", () => {
    expect(
      matchRailDigitShortcut(keyEvent({ code: "Digit3", shiftKey: true }), "shift")
    ).toBe(2);
  });

  it("matches alt+digit without other modifiers", () => {
    expect(
      matchRailDigitShortcut(keyEvent({ code: "Digit0", altKey: true }), "alt")
    ).toBe(9);
  });

  it("rejects the other modifier, chords, repeats, and defaultPrevented", () => {
    expect(
      matchRailDigitShortcut(keyEvent({ shiftKey: true, altKey: true }), "shift")
    ).toBeNull();
    expect(
      matchRailDigitShortcut(keyEvent({ shiftKey: true, ctrlKey: true }), "shift")
    ).toBeNull();
    expect(
      matchRailDigitShortcut(keyEvent({ altKey: true, metaKey: true }), "alt")
    ).toBeNull();
    expect(
      matchRailDigitShortcut(keyEvent({ shiftKey: true, repeat: true }), "shift")
    ).toBeNull();
    expect(
      matchRailDigitShortcut(
        keyEvent({ shiftKey: true, defaultPrevented: true }),
        "shift"
      )
    ).toBeNull();
    expect(
      matchRailDigitShortcut(keyEvent({ shiftKey: true }), "alt")
    ).toBeNull();
  });
});
