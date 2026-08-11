/**
 * Map a vertical mouse wheel to horizontal tab-strip scroll.
 * Returns true when the event should be consumed (preventDefault).
 */
export function scrollTabStripOnWheel(
  element: HTMLElement,
  event: Pick<WheelEvent, "deltaX" | "deltaY">
): boolean {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
    return false;
  }

  const maxScroll = element.scrollWidth - element.clientWidth;
  if (maxScroll <= 0) {
    return false;
  }

  element.scrollLeft = Math.min(
    maxScroll,
    Math.max(0, element.scrollLeft + event.deltaY)
  );
  return true;
}
