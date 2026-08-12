/**
 * Pure helpers for cycling workspace tabs. Shared by keyboard shortcuts and
 * Electron menu handlers so switch logic stays in one place.
 */

export function resolveAdjacentTabId(
  tabs: ReadonlyArray<{ id: string }>,
  activeTabId: string | null,
  direction: "prev" | "next"
): string | null {
  if (tabs.length === 0) {
    return null;
  }
  const currentIndex = activeTabId
    ? tabs.findIndex((tab) => tab.id === activeTabId)
    : -1;
  if (currentIndex < 0) {
    return tabs[0].id;
  }
  const newIndex =
    direction === "prev"
      ? currentIndex <= 0
        ? tabs.length - 1
        : currentIndex - 1
      : currentIndex >= tabs.length - 1
        ? 0
        : currentIndex + 1;
  return tabs[newIndex].id;
}

export function resolveTabIdAtIndex(
  tabs: ReadonlyArray<{ id: string }>,
  index: number
): string | null {
  if (index < 0 || index >= tabs.length) {
    return null;
  }
  return tabs[index].id;
}
