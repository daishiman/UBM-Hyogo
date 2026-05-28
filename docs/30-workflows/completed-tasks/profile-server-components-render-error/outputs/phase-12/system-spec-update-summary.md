# System Spec Update Summary

## Step 1-A: Task Ledger

本 workflow を aiworkflow-requirements の active ledger に同一 wave で登録した。

| Target | Status |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | updated |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | updated |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | updated |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | updated |
| `.claude/skills/aiworkflow-requirements/references/workflow-profile-server-components-render-error-artifact-inventory.md` | created |

## Step 1-B: Implementation Status Table

既存 API / UI feature の public contract は変えないため manual specs の実装状況テーブルは変更しない。workflow state は `implemented_local_evidence_captured / implementation / NON_VISUAL` として ledger に登録した。

## Step 1-C: Related Task Table

Related workflow は `fix-admin-server-components-render-error-stg`（admin 側の同型違反解消）。本タスクはその profile 側 parity 適用に位置づく。

## Step 2: System Spec Update

`apps/web/src/lib/env.ts` の accessor 契約へ `getApiBaseEnv()` を追加し、`apps/web/src/lib/fetch/authed.ts` の runtime base URL 解決契約を「`getApiBaseEnv()` 経由・INTERNAL -> PUBLIC・localhost fallback なし・env 未解決時 throw」へ同期する。`apps/web/app/(member)/profile/page.tsx` の `/me` error handling 契約を「`safeServerFetch` 経由・AuthRequiredError のみ rethrow・それ以外は SectionError UI 降格」へ同期する。

API endpoint surface、shared response schema、database schema は不変。
