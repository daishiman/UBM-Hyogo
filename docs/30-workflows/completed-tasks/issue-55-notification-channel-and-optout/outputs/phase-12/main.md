# Phase 12 Main

## Summary

This workflow formalizes Issue #55 as an implementation task for notification channel abstraction and member notification opt-out.
The workflow is now `implemented_local_evidence_captured`: code, focused tests, SSOT documentation, and local Phase 11 evidence are present in this branch.
Commit, push, production D1 migration apply, staging smoke, and PR creation are not executed in this cycle.

## Boundary

The implementation must align with current code, not an inferred legacy schema.
The canonical storage target is `member_status.notification_opt_out`, the admin UI target is `MemberDrawer`, and the next migration number is `0020_*` because `0015_*` is already used.
`notification_outbox.channel` and the expanded `notification_ledger.event_type` values are part of the same migration because the current ledger CHECK constraint rejects `skipped_opt_out` and `unknown_channel`.

## Local Evidence

- API test suite: 54 files / 352 tests passed.
- Shared test suite: 19 files / 230 tests passed.
- API typecheck: passed.
- Phase 11 files:
  - `outputs/phase-11/admin-member-drawer-opt-out-toggle.png`
  - `outputs/phase-11/d1-ledger-skipped-opt-out.txt`
  - `outputs/phase-11/phase-11-manual-test.md`
