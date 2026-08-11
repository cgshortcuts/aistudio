/**
 * AiStudio product branding for the Electron shell (fork).
 * Keep in sync with web/src/custom/branding/constants.ts and electron-builder.json.
 *
 * APP_DISPLAY_NAME — user-visible label. Window titles, menus, copy.
 * APP_PRODUCT_NAME — technical name matching electron-builder `productName`.
 *   Use for app.setName / userData so install paths stay stable.
 *
 * Window / package icons come from `electron/resources/` (generated from
 * `web/public/ai-icon.svg` via generate_icons_from_svg.mjs).
 */
import path from "path";

export const APP_DISPLAY_NAME = "Ai Studio";
export const APP_PRODUCT_NAME = "AiStudio";
export const APP_ID = "com.aistudio.desktop";
export const APP_SETUP_ARTIFACT = "AiStudio-Setup.exe";

/** Absolute path to the OS-native app icon for BrowserWindow / dock. */
export function getAppIconPath(): string {
  // Main is bundled to dist-electron/main.js, so one level up is the electron/ root.
  const resourcesDir = path.join(__dirname, "..", "resources");
  if (process.platform === "win32") {
    return path.join(resourcesDir, "icon.ico");
  }
  if (process.platform === "darwin") {
    return path.join(resourcesDir, "icon.icns");
  }
  return path.join(resourcesDir, "icon.png");
}
