export type RailShortcutModifier = "shift" | "alt";

const DIGIT_CODES = [
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
  "Digit0"
] as const;

export function railIndexFromCode(code: string): number | null {
  const index = (DIGIT_CODES as readonly string[]).indexOf(code);
  return index === -1 ? null : index;
}

export function railShortcutDigit(index: number): string | null {
  if (index < 0 || index >= DIGIT_CODES.length) {
    return null;
  }
  return DIGIT_CODES[index].slice(-1);
}

export function formatRailShortcut(
  modifier: RailShortcutModifier,
  index: number,
  mac: boolean
): string | null {
  const digit = railShortcutDigit(index);
  if (digit == null) {
    return null;
  }
  if (modifier === "shift") {
    return `⇧${digit}`;
  }
  return mac ? `⌥${digit}` : `Alt+${digit}`;
}

export function matchRailDigitShortcut(
  event: Pick<
    KeyboardEvent,
    | "code"
    | "repeat"
    | "shiftKey"
    | "altKey"
    | "ctrlKey"
    | "metaKey"
    | "defaultPrevented"
  >,
  modifier: RailShortcutModifier
): number | null {
  if (event.repeat || event.defaultPrevented) {
    return null;
  }
  if (event.ctrlKey || event.metaKey) {
    return null;
  }
  if (event.shiftKey !== (modifier === "shift")) {
    return null;
  }
  if (event.altKey !== (modifier === "alt")) {
    return null;
  }
  return railIndexFromCode(event.code);
}
