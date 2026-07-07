# Glossa — Chrome Web Store Upload

Schritt-für-Schritt für das [Developer Dashboard](https://chrome.google.com/webstore/devconsole).  
Texte zum Kopieren: **`STORE_LISTING.md`** · Datenschutz: **`PRIVACY.md`**

---

## Vor dem Upload (lokal)

```powershell
# Extension-ZIP bauen
powershell -File scripts/build-release.ps1

# Optional: Settings-Screenshot neu rendern
powershell -File scripts/render-settings-screenshot.ps1
```

| Prüfpunkt | Datei / Wert |
|-----------|----------------|
| ZIP | `dist/glossa-extension.zip` |
| Version | `manifest.json` → aktuell **1.0.8** |
| Store-Icon | `webstore/assets/icon-128.png` (128×128) |
| Screenshots | `screenshot-01-hover.png`, `-02-selection.png`, `-03-settings.png` (je 1280×800) |
| Promo (1280×800) | `promo-screenshot-1280x800.png` |
| Promo-Tile | `webstore/assets/promo-tile-440x280.png` (440×280) |
| Privacy-URL | `https://github.com/TiiTime/Glossa/blob/master/webstore/PRIVACY.md` |

> Default-Branch = **`master`**. Nicht `main` verwenden (404).

**Wichtig:** Nur `glossa-extension.zip` hochladen — nicht das ganze Git-Repo.

---

## Dashboard — neues Item

1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **Neues Element** (einmalig ~5 USD Google-Entwicklergebühr).
2. **ZIP hochladen:** `dist/glossa-extension.zip`
3. Warten bis automatische Prüfung durch ist (Manifest, Berechtigungen).

---

## Store-Listing (Tab „Store-Eintrag“)

| Feld | Inhalt |
|------|--------|
| **Name** | Glossa |
| **Kurzbeschreibung** | Aus `STORE_LISTING.md` → Short description (max 132 Zeichen) |
| **Ausführliche Beschreibung** | EN und/oder DE aus `STORE_LISTING.md` |
| **Kategorie** | Productivity oder Accessibility |
| **Sprache** | Deutsch + Englisch (beide Localizations anlegen, falls möglich) |
| **Icon** | `webstore/assets/icon-128.png` |
| **Screenshots** | 01, 02, 03 aus `webstore/assets/` (Reihenfolge: Hover → Selection → Settings) |
| **Small promo tile** | `promo-tile-440x280.png` |
| **Homepage** | https://github.com/TiiTime/Glossa |
| **Support** | https://github.com/TiiTime/Glossa/issues |

**Single purpose** (falls abgefragt):  
*Translate words and selected text on web pages via hover or selection.*

---

## Datenschutz (Tab „Datenschutz“)

Antworten wie in `STORE_LISTING.md` → Privacy practices:

- Keine personenbezogenen Daten durch Tii
- Nur zu übersetzender Text → Google Translate
- Nicht verkauft, nicht für andere Zwecke
- **Privacy policy URL:** GitHub-Link zu `webstore/PRIVACY.md` (siehe oben)

---

## Verteilung

- **Sichtbarkeit:** Public
- **Regionen:** Alle (oder nach Wunsch einschränken)
- **Preis:** Kostenlos

---

## Nach dem Einreichen

1. Review abwarten (typisch 1–3 Werktage, kann variieren).
2. Bei Ablehnung: Meldung im Dashboard lesen, ZIP/Listing/Berechtigungen anpassen, neu einreichen.
3. Nach Freigabe: GitHub-Release mit gleicher Version + `Install-Glossa.bat` optional aktualisieren; README kann auf Store-Link verweisen.

---

## Asset-Regenerierung

| Was | Befehl |
|-----|--------|
| Icons + Promo aus Logo | `powershell -File scripts/export-store-assets.ps1` (Logo: `glossa-logo-source.png`) |
| Hover/Selection Screenshots | Quellen `glossa-screenshot-*-source.png` ersetzen → `export-store-assets.ps1` |
| Alle Store-Screenshots (1280×800, kein Alpha) | `powershell -File scripts/fix-store-screenshots.ps1` |
| Settings-Screenshot | `settings-screenshot.html` bearbeiten → `render-settings-screenshot.ps1` |
