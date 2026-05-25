# System Spec Update Summary

[実装区分: 実装仕様書]

## Summary

`apps/web` env アクセス不変条件を current facts へ同期済み。local 実装は完了し、runtime smoke / commit / push / PR は user-gated。

## Step 1-A: タスク完了記録

| 同期先 | 結果 |
| --- | --- |
| 本 workflow `index.md` / `artifacts.json` | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / local evidence captured へ更新 |
| source unassigned task | `consumed_at` / `canonical_workflow` pointer を追記 |
| aiworkflow quick/resource/task active/changelog | 同一 wave で登録 |
| artifact inventory | `workflow-fix-admin-scr-err-stg-fu-001-auth-env-via-getenv-artifact-inventory.md` を追加 |

## Step 1-B: 実装状況テーブル更新

`artifacts.json.status` は `runtime_pending`、`metadata.workflow_state` は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`、
`metadata.implementation_status` は `implemented_local_evidence_captured`。Phase 1-12 は `completed`、Phase 13 は
user-gated のため `blocked`。

## Step 1-C: 関連タスクテーブル更新

| 関連 | 結果 |
| --- | --- |
| 親 TASK-FIX-ADMIN-SCR-ERR-STG-001（PR #849 / #877） | 本 follow-up を local implemented / runtime pending として正本登録 |
| 先行単一ファイル仕様 | consumed pointer で canonical workflow へ接続 |

## Step 2: システム仕様更新

`CLAUDE.md` と `aiworkflow-requirements/references/environment-variables.md` を更新し、`apps/web/src/lib/env.ts` の公開アクセサを用途別に正本化した。

| Accessor | Contract |
| --- | --- |
| `getEnv()` | data/server fetch 境界。必須 schema を parse し、失敗時は throw |
| `getPublicEnv()` | public metadata / CSP 等の公開値のみを返す |
| `getAuthEnv()` | auth 境界専用。safeParse partial + `API_SERVICE` binding 同梱で invariant #11 fail-closed を維持 |
| `getPublicFetchEnv()` | public fetch の service-binding / local HTTP fallback 判定を env.ts に閉じる |

## Issue #862 Deviation

Issue #862 の「`getEnv()` 経由」「parse 失敗 throw 維持」は、現行 auth 境界の fail-closed 要件と衝突するため、
`getAuthEnv()`（safeParse・throw しない）へ再解釈した。これは env 参照の単一所有権を `env.ts` に集約するという
不変条件の本質を満たす。
