/**
 * AiStudio product branding (fork).
 * Keep Electron and web display names in sync with electron-builder.json.
 *
 * SVG masters live in `web/public/` (`cgshortcuts-ai-logo-color.svg` top-left,
 * `ai-icon.svg` everywhere else). Sized copies are written by
 * `assets/generate_icons_from_svg.mjs` into `web/public/`, `electron/`, and
 * root `ai-icon.ico` (Windows Explorer + shortcuts).
 */
export const APP_DISPLAY_NAME = "AiStudio";
export const APP_ID = "com.aistudio.desktop";
export const APP_SETUP_ARTIFACT = "AiStudio-Setup.exe";
export const APP_GITHUB_OWNER = "cgshortcuts";
export const APP_GITHUB_REPO = "aistudio";

/** Public URL for the top-left rail mark (full color lockup). */
export const APP_ICON_SRC = "/cgshortcuts-ai-logo-color.svg";
/** Public URL for favicons, error page, and other brand surfaces. */
export const APP_LOGO_SRC = "/ai-icon.svg";
