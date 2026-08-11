/**
 * Lets the asset lightbox Space shortcut toggle whichever media viewer is
 * mounted (video or audio) without threading refs through useAssetDisplay.
 */

type PlayToggle = () => void;

let registeredToggle: PlayToggle | null = null;

export function registerMediaPlayToggle(toggle: PlayToggle | null): void {
  registeredToggle = toggle;
}

export function toggleRegisteredMediaPlay(): boolean {
  if (!registeredToggle) {
    return false;
  }
  registeredToggle();
  return true;
}
