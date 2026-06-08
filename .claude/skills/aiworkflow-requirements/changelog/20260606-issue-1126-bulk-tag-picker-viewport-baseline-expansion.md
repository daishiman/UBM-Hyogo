# 2026-06-06 issue-1126-bulk-tag-picker-viewport-baseline-expansion

`docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/` を `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` として正本同期した。

Issue #1126（CLOSED 維持）は、issue #1077 の authenticated staging bulk tag picker baseline follow-up。`apps/web/playwright/fixtures/viewports.ts` に `wide` viewport を additive 追加し、`admin-members-bulk-tag-authenticated.spec.ts` に mobile / tablet / wide の assign / unassign screenshot assertions を追加した。既存 desktop no-suffix baseline と read-only capture boundary は維持する。

## Scope

- implementation targets:
  - `apps/web/playwright/fixtures/viewports.ts`
  - `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`
- baseline: `bulk-tag-picker-{assign,unassign}-mode-{mobile,tablet,wide}.png`
- invariant: bulk apply mutation は押さず、apps/api / D1 schema / Google Form / production UI component は変更しない
- user-gated: staging storageState mint, authenticated capture, `--update-snapshots`, baseline approval, commit, push, PR, Issue mutation

## Synced Ledgers

- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `references/task-workflow-active.md`
- `references/workflow-issue-1126-bulk-tag-picker-viewport-baseline-expansion-artifact-inventory.md`
- `changelog/20260606-issue-1126-bulk-tag-picker-viewport-baseline-expansion.md`
- `LOGS/_legacy.md`
- `SKILL-changelog.md`

