# Glossa hover stability implementation plan

**Goal:** Implement the user's approved items 1–3, preserving hover/selection translation and the existing settings.

**Architecture:** Keep the dependency-free MV3 extension. Track a hover target by DOM range, use the same hit testing when entering, waiting and receiving a result, and share pending background requests by text/source/target language.

**Scope:** Stable dwell timer; stale-result protection on pointer/selection/settings changes; nested open Shadow DOM and editable protection; deduplicated requests. No new UI, permissions, translation provider, persistent history or keyboard features.

**Backup:** Full project including Git and untracked files verified before edits at `C:\Users\tarik\Projects\Glossa-backups\Glossa-v1.0.10-before-update-20261106-091740.zip` (203 files). SHA-256 `474678bb7123674e471ee0bbaf6d7cb7b4160dec35db53be1f04b79726f0aad9`.

**Execution:** User explicitly requested implementation; work inline on `codex/glossa-hover-stability` in the existing folder. No additional worktree, publishing or installation. Tests use Node's built-in test runner and an isolated headless browser profile.

## Tasks

- [x] Write failing regression tests against the existing scripts: dwell through jitter, identical words at different locations, pending/result transitions, language/disable changes, nested Shadow DOM, editable elements, shared requests and fallback cleanup.
- [x] Update `content.js`: DOM-range target identity, non-resetting dwell timer, consistent deep hit testing and editable checks, pending request suppression, immediate settings invalidation and settings-load ordering.
- [x] Update `background.js`: in-flight map keyed by translation input, language isolation, cleanup after success/failure, existing cache/fallback retained.
- [x] Run all tests and syntax checks; review changes independently; resolve substantive findings with regression tests.
- [x] Prepare local v1.0.11 package and concise changelog; validate ZIP contents against source. Keep existing backup untouched.

## Review focus

Small movements must preserve dwell time. Different occurrences of identical text must start fresh. Leaving during a pending request must never reopen the popup. Language changes and rapid settings reads must not restore stale state. Closed roots remain inaccessible; test nested open roots with real browser caret APIs. Avoid interfering with editors, including pending requests and shadow editors.

## Progress

- Backup verified; original JS syntax checks passed; no existing test suite or dependencies. Only pre-existing untracked directory: `.claude/`.
- Ruling: use a feature branch in place with a full backup; user requested direct execution in this project.
- Initial regression run: eight expected behavior failures against the original scripts; six existing behaviors passed. Core fixes turned all 14 green.
- Expanded tests: selection, zero delay, startup settings, stale results and real extension integration. Review found a timer race that cancelled the next word's pending hover; two failing regressions reproduced it, then passed after reprocessing the latest pointer target. Glyph-boundary detection was also covered and fixed.
- Independent reviewer: no remaining actionable findings; independently ran all 34 tests successfully.
- Second-browser check: all 25 worker/content-script tests passed in Edge. Actual unpacked MV3 integration passed in Brave with real messaging, settings popup and storage; HTTP responses controlled for deterministic failures.
- Live endpoint smoke test: both `gtx` and `dict` returned `Hallo` for `hello` to German.
- Local v1.0.11 ZIP: 10 runtime files verified byte-for-byte against source and staging; 33,195 bytes, SHA-256 `5ef3add94cbfdbbfc8d0ed8c08606591b71479cc6795605f9c80ed1f2770d430`. Backup SHA-256 rechecked unchanged. Store and GitHub publication remain outside this task.
- Final verification: 35 tests passed in Brave (including loaded-extension integration), 26 passed with Edge; all four runtime JS syntax checks and `git diff --check` passed. Added whitespace-boundary regression after glyph-edge fix.
