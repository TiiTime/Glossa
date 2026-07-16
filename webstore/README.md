# Web Store assets

Ready-to-upload materials for the Chrome Web Store.

## Status (v1.0.9 live · v1.0.10 ready to upload)

Published: [Glossa on the Chrome Web Store](https://chromewebstore.google.com/detail/glossa/jopklcgamodpahihakgiogohpiaafamm)

Package: `dist/glossa-extension.zip` (version **1.0.10**) — build with `scripts/build-release.ps1`.

| Asset | File | Size |
|-------|------|------|
| Store icon | `assets/icon-128.png` | 128×128 |
| Screenshot 1 — hover | `assets/screenshot-01-hover.png` | 1280×800 |
| Screenshot 2 — selection | `assets/screenshot-02-selection.png` | 1280×800 |
| Screenshot 3 — settings | `assets/screenshot-03-settings.png` | 1280×800 |
| Promo (screenshot size) | `assets/promo-screenshot-1280x800.png` | 1280×800 |
| Small promo tile | `assets/promo-tile-440x280.png` | 440×280 |
| Extension ZIP | `../dist/glossa-extension.zip` | `build-release.ps1` |

Optional later: marquee promo 1400×560 (see `STORE_LISTING.md`).

## Upload

**→ [`UPLOAD_CHECKLIST.md`](UPLOAD_CHECKLIST.md)** — Dashboard-Schritte, URLs, Privacy-Antworten.

Copy-paste text: **`STORE_LISTING.md`** · Privacy: **`PRIVACY.md`**

## Build ZIP

```powershell
powershell -File scripts/build-release.ps1
```

Upload **`dist/glossa-extension.zip`** only.

## Regenerate assets

**Logo, icons, promo, hover/selection screenshots** (from source PNGs):

```powershell
powershell -File scripts/export-store-assets.ps1
```

Sources in `assets/`: `glossa-logo-source.png`, `glossa-screenshot-*-source.png`, `glossa-promo-tile-source.png`.

**Settings screenshot** (HTML mockup → PNG):

```powershell
powershell -File scripts/render-settings-screenshot.ps1
```

**All store screenshots + promo** (export sources, render HTML, fix sizes, strip version badges):

```powershell
powershell -File scripts/render-all-store-screenshots.ps1
```

Edit `assets/settings-screenshot.html` first if the popup UI changes.
