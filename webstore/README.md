# Web Store assets

Ready-to-upload materials for the Chrome Web Store.

## Quick start

1. Read **`STORE_LISTING.md`** — copy descriptions, category, privacy answers
2. Upload images from **`assets/`**:
   - `icon-128.png`
   - `screenshot-01-hover.png`, `screenshot-02-selection.png` (1280×800)
   - `promo-tile-440x280.png`
3. Privacy policy URL: `webstore/PRIVACY.md` on GitHub
4. Extension ZIP: `powershell -File scripts/build-release.ps1` → `dist/glossa-extension.zip`

## Regenerate assets after logo change

1. Replace `assets/glossa-logo-source.png`
2. Run: `powershell -File scripts/export-store-assets.ps1`

Source mockups: `glossa-*-source.png` in `assets/`.
