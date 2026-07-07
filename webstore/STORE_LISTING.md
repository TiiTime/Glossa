# Glossa — Chrome Web Store Listing

Copy-paste material for the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).  
Assets live in `webstore/assets/`.

---

## Store icon (required)

| File | Size |
|------|------|
| `webstore/assets/icon-128.png` | 128×128 |
| Extension package also ships `icons/icon16.png`, `icon48.png`, `icon128.png` |

---

## Screenshots (required, 1–5)

Upload as **1280×800** (preferred) or 640×400, square corners, no padding.  
**PNG must be 24-bit RGB — no alpha channel.** If Google rejects size: `powershell -File scripts/fix-store-screenshots.ps1`

| # | File | Caption (optional overlay) |
|---|------|---------------------------|
| 1 | `screenshot-01-hover.png` | Hover any word — translate instantly |
| 2 | `screenshot-02-selection.png` | Select text — full sentence translation |
| 3 | `screenshot-03-settings.png` | Simple settings — language & delay |
| 4 | `promo-screenshot-1280x800.png` | Promo tile — logo & tagline (1280×800) |

Regenerate all: `powershell -File scripts/render-all-store-screenshots.ps1`

---

## Small promo tile (recommended)

| File | Size |
|------|------|
| `promo-tile-440x280.png` | 440×280 |

---

## Marquee promo tile (optional)

| File | Size |
|------|------|
| `promo-marquee-1400x560.png` | 1400×560 (create from logo + tagline if needed) |

---

## Short description (max 132 characters)

**EN:** Hover words or select text for instant translation. Lightweight, works on most sites. Free by Tii.

**DE:** Wörter anhoveren oder Text markieren — sofort übersetzen. Schlank, zuverlässig. Kostenlos von Tii.

---

## Detailed description — English

**Glossa** translates words and phrases while you browse — no copy-paste, no tab switching.

Hover over any word for one second and a small popup shows the translation (target language on top, original below). Select a sentence and get an instant translation, or hover anywhere on your selection to translate the full text.

**Why Glossa?**

- Works on most websites, including many pages where older hover translators fail
- Shadow DOM popup — site styles cannot break it
- Lean extension (no jQuery), low resource use
- Dual translation API fallback + local cache
- Target languages: **80+** widely spoken languages — selectable in the popup (German, English, Arabic, Hindi, Chinese, …)

**How to use**

1. Install Glossa
2. Choose your target language from the extension icon
3. Hover a word for 1 second, or select text
4. Move the mouse away to close the popup

**Privacy**

Text to translate is sent to Google Translate public endpoints. Glossa does not run its own servers. Settings and cache stay in your browser. See our privacy policy on GitHub.

**Free & open source** — built by **Tii**.  
https://github.com/TiiTime/Glossa

---

## Detailed description — Deutsch

**Glossa** übersetzt Wörter und Sätze beim Surfen — ohne Kopieren, ohne neuen Tab.

Einfach ein Wort eine Sekunde anhoveren: Ein kleines Popup zeigt die Übersetzung (Zielsprache oben, Original unten). Text markieren für sofortige Übersetzung — oder auf der Markierung hoveren für den ganzen Satz.

**Warum Glossa?**

- Funktioniert auf den meisten Webseiten, auch dort wo ältere Hover-Übersetzer scheitern
- Popup im Shadow DOM — Seiten-CSS kann es nicht zerstören
- Schlank (kein jQuery), wenig Ressourcen
- Zwei API-Fallbacks + lokaler Cache
- Zielsprachen: **80+** meist gesprochene Sprachen — im Popup wählbar (Deutsch, Englisch, Arabisch, Hindi, Chinesisch, …)

**Bedienung**

1. Glossa installieren
2. Zielsprache über das Extension-Icon wählen
3. Wort 1 Sek. anhoveren oder Text markieren
4. Maus weg → Popup zu

**Datenschutz**

Zu übersetzender Text geht an öffentliche Google-Translate-Endpunkte. Kein eigener Server von Tii. Einstellungen und Cache bleiben im Browser. Datenschutzerklärung auf GitHub.

**Kostenlos & Open Source** — von **Tii**.  
https://github.com/TiiTime/Glossa

---

## Category

**Productivity** or **Accessibility**

---

## Language

Primary: **German** and **English** (add both localizations in dashboard if possible)

---

## Privacy practices (dashboard questionnaire)

| Question | Answer |
|----------|--------|
| Collects user data? | No personal data collected by Tii |
| What is sent? | Selected/hovered text to Google Translate for translation |
| Sold to third parties? | No |
| Used for unrelated purposes? | No |

**Privacy policy URL:**  
`https://github.com/TiiTime/Glossa/blob/master/webstore/PRIVACY.md`

> **Hinweis:** Default-Branch ist **`master`**, nicht `main`. `/blob/main/...` liefert 404.

---

## Homepage / support

| Field | URL |
|-------|-----|
| Homepage | https://github.com/TiiTime/Glossa |
| Support | https://github.com/TiiTime/Glossa/issues |

---

## Package to upload

Build with:

```powershell
powershell -File scripts/build-release.ps1
```

Upload **`dist/glossa-extension.zip`** — not the full Git repo.

---

## Single purpose description (if asked)

Translate words and selected text on web pages via hover or selection.
