# Complete inline update history

User instruction: every update and its changes must also be written in updates.html. Preserve the historical entries and maintain them for future releases.

Implemented with release-notes.json as the editable DE/EN history and scripts/sync-update-notes.ps1 writing HTML between explicit markers. The build runs synchronization before copying runtime files. The HTML contains real German list entries and escaped English attributes; updates.js switches existing content without fetching JSON. Direct file opening and disabled-JavaScript readability are supported. Version 1.0.13 preserves the already published 1.0.12 asset.

Documented releases included: 1.0.13, 1.0.12, 1.0.11, 1.0.10, 1.0.9 and the 1.0.4 installer release. Intermediate early releases have no additional detailed record; no changes were invented.

Regression: actual browser with scripts disabled initially showed zero entries; after the change every DE/EN item matches the release data, and file:// opening initializes correctly. Independent review reported no findings. Existing translation and once-per-version notice behavior are preserved.
