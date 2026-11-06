# Glossa installed-update notice

## Approved design

User requested an automatically opened page for future updates, then clarified that automatic installation should show **Glossa wurde aktualisiert** with the new features. Open once per installed version, not on first install, same-version reloads, browser updates or browser starts. Preserve translation behavior and existing settings.

Package the page with the extension so it works offline and its release notes always match the installed version. This avoids hosting dependencies and extra network checks. The page displays a German/English language switch, version, short release notes and a Chrome Web Store link. No tracking, remote scripts or new permissions.

Use `chrome.runtime.onInstalled` with `reason === 'update'` and a changed `previousVersion`. Persist the last displayed version in `chrome.storage.local`; serialize notice attempts to prevent duplicate tabs. A failed tab creation must not mark the notice shown. Future releases update `release-notes.json` alongside the manifest.

## Implementation plan

- [x] Backup v1.0.11 before editing.
- [x] Add failing lifecycle tests for initial install, real update, duplicate/concurrent delivery, same-version reload, Chrome updates and tab failure.
- [x] Implement listener in `background.js` and bundled `updates.html`, `updates.css`, `updates.js`, `release-notes.json`; include files in release packaging. Version 1.0.12.
- [x] Test the page in a real browser and perform an actual unpacked-extension version upgrade; verify one tab and no repeat after reload.
- [x] Run full regression suite, independent review, syntax and package validation.
- [x] Save patchnotes and new local release. GitHub delivery follows validation; Store submission remains with user.

## Verification focus

First installation and same-version reload are distinct from upgrades. The stored marker must survive a service-worker restart. Failures must allow retry. Render content with textContent, match release-note version to the manifest and avoid external requests on the bundled page. Keep the existing translation suite green.

## Results (2026-11-07)

- Backup: `C:\Users\tarik\Projects\Glossa-backups\Glossa-v1.0.11-before-update-page-20261107-000016.zip`, 244 files verified, SHA-256 `5fac4a2a7489a3f3a9cef2537f0b20452a1c15d327ae14861e4c58f9466778d1`.
- Lifecycle tests initially had four expected failures against the old worker; all passed after implementation.
- Actual unpacked 1.0.11 → 1.0.12 upgrade opened one tab; another same-version reload opened none. Developer mode is required for reloads in the isolated Brave test profile. DE/EN, mobile overflow and desktop screenshot checked.
- Build guard regression initially failed, then passed: mismatched release notes cannot overwrite an existing package.
- Final suite: 42 passed, 0 failed. Second-browser worker/content/lifecycle checks: 31 passed. Independent reviewer reported no actionable issue. Runtime syntax and diff whitespace checks passed.
- ZIP: 14 runtime files verified against source; 38,141 bytes; SHA-256 `42d3ddfaba3d2e648dc29458cc42880d1bc7584e6ceb3d2ab7dda613c2085418`. No additional permissions.
