# Glossa — Chrome Web Store Upload

> **Status:** v1.0.9 live · **v1.0.10 bereit zum Upload**  
> Store: [Glossa](https://chromewebstore.google.com/detail/glossa/jopklcgamodpahihakgiogohpiaafamm)

Schritt-für-Schritt für das [Developer Dashboard](https://chrome.google.com/webstore/devconsole).  
Texte zum Kopieren: **`STORE_LISTING.md`** · Datenschutz: **`PRIVACY.md`**

---

## Vor dem Upload (lokal)

```powershell
# Extension-ZIP bauen (v1.0.10)
powershell -ExecutionPolicy Bypass -File scripts/build-release.ps1
```

| Prüfpunkt | Datei / Wert |
|-----------|----------------|
| ZIP | `dist/glossa-extension.zip` |
| Version | `manifest.json` → **1.0.10** |
| Permissions | nur `storage` (+ host: Google Translate) |
| Store-Icon | `webstore/assets/icon-128.png` (128×128) |
| Screenshots | `screenshot-01-hover.png`, `-02-selection.png`, `-03-settings.png` (je 1280×800, 24-bit RGB) |
| Promo (1280×800) | `promo-screenshot-1280x800.png` |
| Promo-Tile | `webstore/assets/promo-tile-440x280.png` (440×280) |
| Privacy-URL | `https://github.com/TiiTime/Glossa/blob/master/webstore/PRIVACY.md` |

> Default-Branch = **`master`**. Nicht `main` verwenden (404).

**Wichtig:** Nur `glossa-extension.zip` hochladen — nicht das ganze Git-Repo.

---

## Dashboard — Update (bestehendes Item)

1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **Glossa** öffnen.
2. Tab **Paket** → **Neues Paket hochladen** → `dist/glossa-extension.zip`.
3. Automatische Prüfung abwarten (Manifest, Berechtigungen).
4. Optional: Update-Hinweise oben in **Beschreibung** einfügen (siehe **`CHANGELOG.md`** — kein separates „Neu in dieser Version“-Feld).
5. **Zur Überprüfung einreichen** / **Prüfen lassen**.

Screenshots/Icon/Privacy müssen nur geändert werden, wenn sich etwas geändert hat — für 1.0.10 reichen die bestehenden Assets.

---

## Store-Listing (falls Felder leer / Update)

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
3. Nach Freigabe: GitHub-Release `v1.0.10` mit `glossa-extension.zip`; README-Version auf 1.0.10 setzen.

---

## Asset-Regenerierung

| Was | Befehl |
|-----|--------|
| Icons + Promo aus Logo | `powershell -ExecutionPolicy Bypass -File scripts/export-store-assets.ps1` |
| Hover/Selection Screenshots | Quellen ersetzen → `export-store-assets.ps1` |
| Alle Store-Screenshots (1280×800, kein Alpha) | `powershell -ExecutionPolicy Bypass -File scripts/fix-store-screenshots.ps1` |
| Settings-Screenshot | `settings-screenshot.html` bearbeiten → `render-settings-screenshot.ps1` |
