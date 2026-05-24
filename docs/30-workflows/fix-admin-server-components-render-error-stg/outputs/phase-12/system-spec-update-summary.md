# System Spec Update Summary

## Step 1-A: Task Ledger

本 workflow を aiworkflow-requirements の active ledger に登録した。

| Target | Status |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | updated |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | updated |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | updated |
| `.claude/skills/aiworkflow-requirements/references/workflow-fix-admin-server-components-render-error-stg-artifact-inventory.md` | created |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | updated |
| `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | updated |

## Step 1-B: Implementation Status Table

既存 API / UI feature の public contract は変えないため manual specs の実装状況テーブルは変更しない。workflow state は `implemented_local_runtime_pending / implementation / NON_VISUAL` として ledger に登録した。

## Step 1-C: Related Task Table

Related PR #849 の admin dashboard runtime smoke を regression boundary として参照する。staging deploy / authenticated runtime smoke / commit / push / PR は user-gated。

## Step 2: System Spec Update

`apps/web/src/lib/env.ts` の runtime schema に `INTERNAL_AUTH_SECRET` optional を追加した。
`architecture-admin-api-client.md` の Server-side fetch 正本も、`fetchAdmin()` が `getEnv().INTERNAL_API_BASE_URL` / `getEnv().INTERNAL_AUTH_SECRET` を使い、localhost fallback を持たない契約へ同期した。

API endpoint surface、shared response schema、database schema は不変。
