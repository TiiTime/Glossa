# Glossa

**Hover-Übersetzer für Brave und Chrome** — Wort unter der Maus oder markierter Text, Übersetzung in einem kleinen Popup.

Entwickelt von **Tii**. **Kostenlos** und Open Source (siehe [LICENSE](LICENSE)).

**Installation:** [**Chrome Web Store**](https://chromewebstore.google.com/detail/glossa/jopklcgamodpahihakgiogohpiaafamm) (empfohlen für Chrome) · [Windows-Installer](#einfach-installer-windows) · [manuell](#manuell)

**English:** [below ↓](#english)

---

## So funktioniert es

| Aktion | Ergebnis |
|--------|----------|
| **Maus 1 Sekunde auf ein Wort** | Übersetzung erscheint (Standard: Zielsprache oben, Original unten) |
| **Maus weg vom Wort** | Popup schließt sofort |
| **Text markieren** | Sofortige Übersetzung der Auswahl |
| **Maus auf markierten Text** (egal wo) | Nach 1 Sekunde wird der **ganze** markierte Text übersetzt |
| **ESC** | Popup schließen |

**Einstellungen:** Extension-Icon in der Toolbar → Zielsprache, Hover-Verzögerung, An/Aus.

---

## Installation (Brave / Chrome)

### Chrome Web Store (empfohlen)

1. [Glossa im Chrome Web Store](https://chromewebstore.google.com/detail/glossa/jopklcgamodpahihakgiogohpiaafamm) öffnen
2. **Zu Chrome hinzufügen** klicken
3. Fertig — Updates kommen automatisch über den Store

Gilt für **Google Chrome**. In **Brave** funktioniert der Store-Link oft ebenfalls; sonst Installer oder manuelle Installation unten.

### Einfach: Installer (Windows)

1. [Releases](https://github.com/TiiTime/Glossa/releases/latest) öffnen
2. `Install-Glossa.bat` herunterladen (oder Repo klonen → `install/Install-Glossa.bat` doppelklicken)
3. Installer lädt Glossa automatisch und öffnet die Extension-Seite im Browser
4. **Einmalig:** Entwicklermodus an → *Entpackte Erweiterung laden* → Ordner aus der Meldung wählen (liegt unter `%LOCALAPPDATA%\Glossa\extension`)

**Hinweis:** Ohne Chrome Web Store braucht Brave/Chrome den **Entwicklermodus** — der Installer erledigt Download, Entpacken und den richtigen Ordner.

### Manuell

1. Ordner mit Glossa herunterladen oder klonen
2. `brave://extensions` bzw. `chrome://extensions` öffnen
3. **Entwicklermodus** aktivieren
4. **Entpackte Erweiterung laden**
5. Den Glossa-Ordner auswählen

**Nach jedem Glossa-Update:** Extension unter *Neu laden* klicken und die **geöffnete Webseite mit F5** aktualisieren.

**Tipp:** Andere Hover-Übersetzer (z. B. TransOver) am besten deaktivieren — sonst Konflikte.

---

## Wichtige Hinweise

### Datenschutz

- Glossa sendet den zu übersetzenden Text an **Google Translate** (öffentliche Endpunkte, wie viele kostenlose Übersetzer-Extensions).
- Es gibt **kein eigenes Konto** und **keinen Server von Tii**.
- Zuletzt übersetzte Texte werden **nur lokal im Browser** kurz zwischengespeichert (Cache, schnellere Wiederholung).
- Einstellungen (Sprache, Verzögerung) liegen in `chrome.storage.sync` deines Browsers.

### Grenzen

- Text in **Bildern** oder **Canvas** kann nicht übersetzt werden.
- **Eingabefelder** werden bewusst ignoriert.
- Manche **iframes** von anderen Domains blockiert der Browser — das kann keine Extension umgehen.
- Sehr kurze Wörter (unter 2 Zeichen, außer z. B. chinesische Zeichen) werden übersprungen.
- Bei sehr vielen Anfragen kann Google kurzzeitig limitieren.

### Kosten

- **Glossa ist kostenlos** — im [Chrome Web Store](https://chromewebstore.google.com/detail/glossa/jopklcgamodpahihakgiogohpiaafamm) und als Open Source.
- Keine Nutzungsgebühren, kein Tii-Konto.

---

## Technik (kurz)

- Manifest V3, schlankes Vanilla-JavaScript (kein jQuery)
- Shadow DOM für das Popup (Seiten-CSS kann es nicht kaputtmachen)
- Zwei API-Fallbacks + lokaler Cache
- Funktioniert auf den meisten normalen Webseiten zuverlässiger als ältere Hover-Übersetzer

---

## Lizenz

MIT — frei nutzbar, kopierbar, anpassbar. **Tii** als Urheber nennen, wenn du es weiter gibst.

Details: [LICENSE](LICENSE)

---

## Chrome Web Store

**Live:** [Glossa im Chrome Web Store](https://chromewebstore.google.com/detail/glossa/jopklcgamodpahihakgiogohpiaafamm) (v1.0.9 · Update **1.0.10** bereit)

Listing-Texte, Screenshots und Datenschutz für Updates: Ordner [`webstore/`](webstore/) · [`STORE_LISTING.md`](webstore/STORE_LISTING.md)  
**Patches / Versionshinweise:** [`CHANGELOG.md`](CHANGELOG.md) (oben in die Store-**Beschreibung** kopieren — kein separates Update-Feld)

---

## Icons neu erzeugen (optional, nur für Entwickler)

```powershell
powershell -File scripts/create-icons.ps1
```

---

## English

**Hover translator for Brave and Chrome** — hover a word or select text, get a translation in a small popup.

Built by **Tii**. **Free** and open source (see [LICENSE](LICENSE)).

**Install:** [**Chrome Web Store**](https://chromewebstore.google.com/detail/glossa/jopklcgamodpahihakgiogohpiaafamm) (recommended for Chrome) · [Windows installer](#easy-installer-windows) · [manual](#manual)

### How it works

| Action | Result |
|--------|--------|
| **Hover on a word for 1 second** | Translation appears (target language on top, original below) |
| **Move mouse away** | Popup closes immediately |
| **Select text** | Instant translation of the selection |
| **Hover anywhere on selected text** | After 1 second, the **full** selection is translated |
| **ESC** | Close popup |

**Settings:** Click the extension icon → target language, hover delay, on/off.

### Installation (Brave / Chrome)

#### Chrome Web Store (recommended)

1. Open [Glossa on the Chrome Web Store](https://chromewebstore.google.com/detail/glossa/jopklcgamodpahihakgiogohpiaafamm)
2. Click **Add to Chrome**
3. Done — updates arrive automatically via the store

Works in **Google Chrome**. In **Brave**, the store link often works too; otherwise use the installer or manual steps below.

#### Easy: installer (Windows)

1. Open [Releases](https://github.com/TiiTime/Glossa/releases/latest)
2. Download and run `Install-Glossa.bat` (or clone repo → double-click `install/Install-Glossa.bat`)
3. The installer downloads Glossa and opens the extensions page
4. **One-time:** Enable Developer mode → *Load unpacked* → pick the folder from the dialog (`%LOCALAPPDATA%\Glossa\extension`)

**Note:** Without the Chrome Web Store, Brave/Chrome require **Developer mode** — the installer handles download, extract, and the correct folder path.

#### Manual

1. Download or clone this repository
2. Open `brave://extensions` or `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the Glossa folder

**After every Glossa update:** Click *Reload* on the extension and **refresh the open page (F5)**.

**Tip:** Disable other hover translators (e.g. TransOver) to avoid conflicts.

### Important notes

**Privacy**

- Glossa sends text to be translated to **Google Translate** (public endpoints, like many free translator extensions).
- There is **no Tii account** and **no Tii server**.
- Recent translations are cached **locally in your browser** only.
- Settings are stored in your browser’s `chrome.storage.sync`.

**Limitations**

- Text inside **images** or **canvas** cannot be translated.
- **Input fields** are intentionally ignored.
- Some **cross-origin iframes** are blocked by the browser — no extension can fix that.
- Very short words (under 2 characters, except e.g. CJK) are skipped.
- Google may rate-limit heavy use.

**Cost**

- **Glossa is free** — on the [Chrome Web Store](https://chromewebstore.google.com/detail/glossa/jopklcgamodpahihakgiogohpiaafamm) and as open source.
- No usage fees, no Tii account required.

### Tech (brief)

- Manifest V3, lean vanilla JavaScript (no jQuery)
- Shadow DOM popup (immune to page CSS)
- Dual API fallback + local cache
- More reliable than older hover translators on most sites

### License

MIT — free to use, copy, and modify. Please credit **Tii** when you redistribute.

Details: [LICENSE](LICENSE)

### Chrome Web Store

**Live:** [Glossa on the Chrome Web Store](https://chromewebstore.google.com/detail/glossa/jopklcgamodpahihakgiogohpiaafamm) (v1.0.9 · update **1.0.10** ready)

Listing copy, screenshots, and privacy for updates: [`webstore/`](webstore/) · [`STORE_LISTING.md`](webstore/STORE_LISTING.md)  
**Patches / release notes:** [`CHANGELOG.md`](CHANGELOG.md) (paste at top of Store **Description** — no separate What's-new field)

### Regenerate icons (optional, developers)

```powershell
powershell -File scripts/create-icons.ps1
```
