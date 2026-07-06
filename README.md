# Glossa

**Hover-Übersetzer für Brave und Chrome** — Wort unter der Maus oder markierter Text, Übersetzung in einem kleinen Popup.

Entwickelt von **Tii**. **Kostenlos** und Open Source (siehe [LICENSE](LICENSE)).

---

## So funktioniert es

| Aktion | Ergebnis |
|--------|----------|
| **Maus 1 Sekunde auf ein Wort** | Übersetzung erscheint (Standard: Deutsch oben, Original unten) |
| **Maus weg vom Wort** | Popup schließt sofort |
| **Text markieren** | Sofortige Übersetzung der Auswahl |
| **Maus auf markierten Text** (egal wo) | Nach 1 Sekunde wird der **ganze** markierte Text übersetzt |
| **ESC** | Popup schließen |

**Einstellungen:** Extension-Icon in der Toolbar → Zielsprache, Hover-Verzögerung, An/Aus.

---

## Installation (Brave / Chrome)

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

- **Glossa selbst ist kostenlos.**
- Es fallen **keine Gebühren** an, solange du es selbst installierst (Entwicklermodus).
- Nur wer später im **Chrome Web Store** veröffentlichen will, zahlt dort einmalig ca. 5 USD an Google — das ist optional und hat nichts mit der Lizenz zu tun.

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

## Icons neu erzeugen (optional, nur für Entwickler)

```powershell
powershell -File scripts/create-icons.ps1
```
