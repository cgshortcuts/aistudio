/**
 * Instant Update auto-runs the downstream subgraph on every node edit.
 * That can spend paid API credits from a keystroke, so this fork keeps
 * it off and hides the toolbar toggle.
 */
export const INSTANT_UPDATE_ALLOWED = false;

export function isInstantUpdateAllowed(): boolean {
  return INSTANT_UPDATE_ALLOWED;
}
