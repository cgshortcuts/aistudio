/**
 * Checkbox-list selection for the workflow menu.
 * Plain click toggles one id. Shift+click selects every id between
 * the last-clicked anchor and the clicked id (inclusive), unioned
 * with the current selection — same pattern as asset grid selection.
 */
export function nextWorkflowSelection(
  sortedIds: string[],
  currentSelection: string[],
  clickedId: string,
  lastSelectedId: string | null,
  shiftKey: boolean
): string[] {
  if (shiftKey && lastSelectedId) {
    const lastIndex = sortedIds.indexOf(lastSelectedId);
    const currentIndex = sortedIds.indexOf(clickedId);
    if (lastIndex !== -1 && currentIndex !== -1) {
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      const next = new Set(currentSelection);
      for (let i = start; i <= end; i++) {
        next.add(sortedIds[i]);
      }
      return Array.from(next);
    }
  }

  return currentSelection.includes(clickedId)
    ? currentSelection.filter((id) => id !== clickedId)
    : [...currentSelection, clickedId];
}
