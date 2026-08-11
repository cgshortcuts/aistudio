export function willOpenLeftPanelView(
  panel: { activeView: string; isVisible: boolean },
  view: string
): boolean {
  return panel.activeView !== view || !panel.isVisible;
}
