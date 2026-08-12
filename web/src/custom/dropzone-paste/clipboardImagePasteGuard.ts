let lastHandledAt = 0;
const HANDLE_WINDOW_MS = 400;

export function markClipboardImagePasteHandled(): void {
  lastHandledAt = Date.now();
}

export function wasClipboardImagePasteJustHandled(): boolean {
  return Date.now() - lastHandledAt < HANDLE_WINDOW_MS;
}

export function resetClipboardImagePasteHandled(): void {
  lastHandledAt = 0;
}
