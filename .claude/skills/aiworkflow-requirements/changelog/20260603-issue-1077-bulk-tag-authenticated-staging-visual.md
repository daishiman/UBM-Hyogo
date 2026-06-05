# 2026-06-03 issue-1077-bulk-tag-authenticated-staging-visual

`docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/` を `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` として正本同期した。

Issue #1077（CLOSED 維持）は、landed 済み bulk member tag assignment（親 `issue-1036-bulk-member-tag-assign`、PR #1085 / commit `ca3fb9336`）の authenticated staging visual baseline follow-up。手動 screenshot 取得ではなく、既存 `staging-visual-authenticated` Playwright project と admin storageState minting を再利用する新規 spec 1 file へ最適化する。

## Scope

- implementation target: `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`
- baseline: `bulk-tag-picker-assign-mode.png` / `bulk-tag-picker-unassign-mode.png`
- invariant: read-only capture only。bulk apply mutation は押さず、apps/api / D1 schema / Google Form 仕様は変更しない
- user-gated: runtime staging capture, baseline generation/commit, push, PR, Issue mutation

## Synced Ledgers

- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `references/task-workflow-active.md`
- `references/workflow-issue-1077-bulk-tag-authenticated-staging-visual-artifact-inventory.md`
- `changelog/20260603-issue-1077-bulk-tag-authenticated-staging-visual.md`
- `LOGS/_legacy.md`
- `SKILL-changelog.md`
