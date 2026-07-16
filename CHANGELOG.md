# Glossa — Changelog / Updates

Patches und Versionshinweise für **GitHub Releases** und den **Chrome Web Store**.

> **Hinweis:** Im Chrome Web Store gibt es **kein** Feld „Neu in dieser Version“.  
> Updates gehören **oben in die Beschreibung** (Store-Eintrag → Beschreibung) — oder nur hier auf GitHub.

Aktuelle Package-Version: **1.0.10** (`manifest.json`)

---

## v1.0.10 — 2026-07-16

Bugfix-Release. Keine neuen Features — Stabilität und UX.

### Für Store-Beschreibung (EN + DE, oben einfügen)

Diesen Block **ganz oben** in die Beschreibung im Dashboard kleben (vor dem bisherigen Text):

```
What's new in v1.0.10
• More stable hover popup (stays while moving on the same word)
• No translation inside input/editor fields
• Only left-click triggers translate on selection
• Hover delay 0 ms can be saved; better Shadow DOM support
• Network timeout, less flicker; unused permission removed

Neu in v1.0.10
• Stabileres Hover-Popup (bleibt beim Bewegen auf demselben Wort)
• Keine Übersetzung in Eingabe-/Editorfeldern
• Nur Linksklick löst Sofort-Übersetzung bei Markierung aus
• Hover-Verzögerung 0 ms speicherbar; besseres Shadow-DOM
• Netzwerk-Timeout, weniger Flackern; unnötige Berechtigung entfernt

---
```

### Kurz nur DE

```
Neu in v1.0.10: Stabileres Hover-Popup, keine Übersetzung in Eingabefeldern, nur Linksklick bei Markierung, Delay 0 ms speicherbar, besseres Shadow-DOM, Timeout & weniger Flackern.
```

### Kurz nur EN

```
What's new in v1.0.10: More stable hover popup, no translate in input fields, left-click-only on selection, delay 0 ms works, better Shadow DOM, timeout & less flicker.
```

### Details (DE)

| ID | Änderung |
|----|----------|
| BUG-01 | Popup schließt nicht mehr bei jeder kleinen Mausbewegung auf demselben Wort |
| BUG-07 | Kein erneutes Laden/Flackern, wenn Ergebnis für dieses Wort schon sichtbar ist |
| BUG-02 | Markierungen in `input` / `textarea` / `contentEditable` werden ignoriert |
| BUG-03 | Rechts- und Mittelklick lösen keine Sofort-Übersetzung mehr aus |
| BUG-04 | Hover-Verzögerung **0 ms** wird korrekt gespeichert (nicht still auf 1000 ms) |
| BUG-05 | Shadow-DOM: Wort unter dem Cursor zuverlässiger erkennen |
| BUG-06 | Extension ausschalten → offenes Popup schließt sofort |
| BUG-08 | Fenster-Fokus weg (Alt-Tab) → Popup schließt |
| BUG-09 | Popup-Position nutzt echte Höhe + Scroll bei langen Texten |
| BUG-10 | Übersetzungs-Fetch bricht nach 8 Sekunden ab (kein ewiges „…“) |
| BUG-11 | Statusmeldung „Gespeichert“ überschreibt sich nicht mehr falsch |
| BUG-12 | Permission `activeTab` entfernt (nicht benötigt) |

### Details (EN)

| ID | Change |
|----|--------|
| BUG-01 | Popup no longer closes on tiny mouse moves over the same word |
| BUG-07 | No reload/flicker when the result for that word is already shown |
| BUG-02 | Selections inside `input` / `textarea` / `contentEditable` are ignored |
| BUG-03 | Right/middle click no longer trigger instant translate on selection |
| BUG-04 | Hover delay **0 ms** saves correctly (not silently forced to 1000 ms) |
| BUG-05 | Shadow DOM: more reliable word-under-cursor detection |
| BUG-06 | Disabling the extension closes an open popup immediately |
| BUG-08 | Window blur (Alt-Tab) closes the popup |
| BUG-09 | Popup placement uses real height + scroll for long text |
| BUG-10 | Translation fetch aborts after 8 seconds (no endless “…” ) |
| BUG-11 | “Saved” status text no longer clears too early on rapid clicks |
| BUG-12 | Removed unused `activeTab` permission |

### Package

- ZIP: `dist/glossa-extension.zip` (bauen mit `scripts/build-release.ps1`)
- Manifest-Version: `1.0.10`
- Permissions: `storage` + Google-Translate Hosts

---

## v1.0.9 — 2026-07-07

Erster Chrome-Web-Store-Release.

### Kurz (DE)

```
Chrome Web Store Veröffentlichung.
87 Zielsprachen, neues Logo, Hover-Stabilität.
Datenschutz- und Listing-Material unter webstore/.
```

### Short (EN)

```
Chrome Web Store release.
87 target languages, new logo, hover stability.
Privacy and listing assets under webstore/.
```

### Highlights

- Store-Listing, Screenshots, Privacy Policy
- Logo / Icons für Store und Extension
- Hover- und Selection-Verhalten poliert
- Installer + Release-ZIP-Pipeline

---

## Ältere Versionen

| Version | Hinweis |
|---------|---------|
| 1.0.0 – 1.0.8 | Frühe Entwicklung / lokale Releases vor dem Store |

---

## Upload-Hinweis

1. Optional: Block **„Für Store-Beschreibung“** oben in **Store-Eintrag → Beschreibung** einfügen.
2. Tab **Paket** → ZIP `dist/glossa-extension.zip` hochladen.
3. Speichern → **Prüfen lassen**.
4. Schritte: [`webstore/UPLOAD_CHECKLIST.md`](webstore/UPLOAD_CHECKLIST.md)
