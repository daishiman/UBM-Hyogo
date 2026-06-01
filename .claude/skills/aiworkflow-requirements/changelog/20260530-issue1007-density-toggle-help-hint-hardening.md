# 2026-05-30 issue-1007 density toggle HelpHint hardening

- Synced `docs/30-workflows/completed-tasks/issue-1007-density-toggle-help-hint-hardening/` as `implemented_local_runtime_pending / implementation / VISUAL`.
- Implemented `DensityToggle` `useId` description ids, non-controlled `<details>` Escape/outside close, `help` icon system integration, pointer target guard, and focused component tests.
- Updated UI system specs `09-ui-ux.md` and `09d-icons.md`.
- Materialized Phase 11 local evidence and Phase 12 strict 7 outputs; runtime visual screenshot, staging deploy, commit, push, and PR remain user-gated.
- Added artifact inventory and active workflow/index entries. Issue #1007 is CLOSED; use `Refs #1007` only.
- Recorded lessons-learned L-DTHH-001..006 (`useId` multi-instance description id namespacing, non-controlled `<details>` + ref imperative close, SSR-safe document listener via `browserDocument()`, Escape focus-restore + pointerdown contains guard, jsdom `<details>` toggle test fallback, icon 3-point sync) in `lessons-learned/lessons-learned-issue-1007-density-toggle-help-hint-hardening-2026-05.md` and the artifact inventory `## Lessons Learned` section.
