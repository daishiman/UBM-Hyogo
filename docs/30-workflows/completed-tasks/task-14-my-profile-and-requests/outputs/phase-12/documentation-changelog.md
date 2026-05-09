# Documentation Changelog

Date: 2026-05-09

## Changed

- Added root `artifacts.json` and mirrored `outputs/artifacts.json`.
- Added Phase 1-13 output ledgers.
- Added Phase 12 strict seven files.
- Added Phase 11 component evidence log and manual screenshot deferred ledger.
- Added workflow state vocabulary to `index.md`.
- Clarified Phase 11 `runtime_pending` and Phase 13 user approval gates.
- Normalized `fetchAuthed` path contract and Dialog side-effect ownership.
- Corrected local implementation status to `apps/web` local reflected / runtime visual pending.
- Corrected pending request contract to server-side `{ visibility?, delete? }` object and `member_only` wording to 会員限定公開.
- Removed optimistic pending behavior from `RequestActionPanel`.
- Added `G-14-10` Sentry smoke DoD.
- Fixed `data-region` selector contract to five explicit selectors.
- Synced aiworkflow-requirements indexes, active workflow, artifact inventory, changelog, and LOGS.

## Commands / Evidence

| Command | Result |
| --- | --- |
| `rg --files docs/30-workflows/task-14-my-profile-and-requests` | completed; package inventory reviewed |
| stale DoD reference grep over task-14 workflow | match 0 (post-fix) |
| `cmp -s artifacts.json outputs/artifacts.json` | exit 0 (parity verified 2026-05-10) |
| `rg -c '#[0-9a-fA-F]{6,8}\b\|bg-\[#\|text-\[#' apps/web/app/profile` | exit 1 / match 0 (HEX gate PASS, 2026-05-10) |
| planned-wording grep (`rg -n` over `phase-{1..11,13}.md` for 仕様策定 / 実行予定 / 保留 系) | exit 1 / match 0 (planned-wording gate PASS, 2026-05-10) |
| `mise exec -- pnpm --filter @ubm-hyogo/web test -- PublicVisibilityBanner` | PASS: 67 files passed / 1 skipped, 500 tests passed / 1 skipped |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS: exit 0 |
