# AiStudio app icon

In-app marks (SVG, committed under `web/public/`):

- Top-left rail: `cgshortcuts-ai-logo-color.svg`
- Everywhere else (favicon / error / Electron / folder): `ai-icon.svg`

Rasterize sized copies from `ai-icon.svg`:

```bash
node web/src/custom/branding/assets/generate_icons_from_svg.mjs
```

Writes:

- `web/public/` favicons and logo PNGs
- `electron/resources/` install / window icons
- `electron/assets/tray-icon.*`
- `electron/src/assets/logo.png` (boot splash)
- `mobile/assets/` Expo icon / splash / favicon
- `ai-icon.ico` at the repo root (Windows Explorer folder + shortcuts)

Legacy Illustrator path (optional):

```bash
python web/src/custom/branding/assets/generate_icons.py
```
