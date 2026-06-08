# workflow-issue-1126-bulk-tag-picker-viewport-baseline-expansion artifact inventory

作成日: 2026-06-06

## Summary

`issue-1126-bulk-tag-picker-viewport-baseline-expansion` is an `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` workflow.

The local code implementation expands the authenticated staging BulkActionBar tag picker visual baseline from desktop-only to mobile / tablet / wide assign and unassign coverage. Authenticated staging capture, baseline snapshot update, commit, push, PR, and Issue mutation remain user-gated.

## Canonical workflow

| Artifact | Path | Status |
| --- | --- | --- |
| root | `docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/` | present |
| index | `docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/index.md` | present |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/artifacts.json` | present |
| output artifacts | `docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/outputs/artifacts.json` | present, mirrored |
| Phase 11 ledger | `docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/outputs/phase-11/` | present, runtime visual pending |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/outputs/phase-12/*.md` | present |

## Implementation targets

| Target | Purpose |
| --- | --- |
| `apps/web/playwright/fixtures/viewports.ts` | Adds `wide` viewport as an additive test fixture value |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` | Adds mobile/tablet/wide assign/unassign screenshot assertions while preserving desktop baseline |

## Runtime visual evidence

| Canonical screenshot | Status | Boundary |
| --- | --- | --- |
| `bulk-tag-picker-assign-mode-mobile.png` | pending | authenticated staging capture |
| `bulk-tag-picker-unassign-mode-mobile.png` | pending | authenticated staging capture |
| `bulk-tag-picker-assign-mode-tablet.png` | pending | authenticated staging capture |
| `bulk-tag-picker-unassign-mode-tablet.png` | pending | authenticated staging capture |
| `bulk-tag-picker-assign-mode-wide.png` | pending | authenticated staging capture |
| `bulk-tag-picker-unassign-mode-wide.png` | pending | authenticated staging capture |

## Lessons Learned

- **L-I1126-001 (implementation target physical existence gate)**: If Phase 1/5 names concrete implementation files and the change is safe in the current cycle, do not close as `spec_created`. Implement the bounded local diff, then classify as `implemented_local_runtime_pending` when only authenticated staging capture / baseline approval remains.
- **L-I1126-002 (visual evidence path ownership)**: Follow-up visual specs must write workflow-local Phase 11 screenshots to their own root, not to the parent completed workflow. Parent workflow evidence is a source reference, not an output sink.
- **L-I1126-003 (responsive baseline additive pattern)**: Preserve the existing desktop no-suffix snapshot and add responsive suffix snapshots for new viewports. This keeps historical baseline continuity while expanding regression coverage.

## User-gated actions

- staging admin storageState minting
- authenticated staging capture and `--update-snapshots`
- baseline review/approval
- commit / push / PR
- GitHub Issue #1126 mutation or comment

