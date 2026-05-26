# System Spec Update Summary — issue-864-admin-staging-runtime-smoke-ci-gate

## Step 1-A: タスク完了記録

- 本タスク root（`docs/30-workflows/completed-tasks/issue-864-admin-staging-runtime-smoke-ci-gate/`）を implemented_local_runtime_pending として作成。
- 親タスク `fix-admin-server-components-render-error-stg` の Phase 11 手動手順を自動 gate へ昇格する後続として位置付け。

## Step 1-B: 実装状況テーブル

| 項目 | 状態 |
| ---- | ---- |
| 仕様書 | Phase 1-12 completed / workflow_state `implemented_local_runtime_pending` |
| 実装コード | 本 wave 実装済み |
| runtime 検証 | `runtime_pending`（Gate-B） |

## Step 1-C: 関連タスクテーブル更新

| 関連 | 更新後ステータス |
| ---- | ---------------- |
| `fix-admin-server-components-render-error-stg` | root-cause 修正 completed（#877/#862/#863 merge 済） |
| `completed-tasks/fix-admin-scr-err-stg-followup-003-staging-runtime-smoke-ci-gate.md` | 本タスクで formalize（phase1-13 化）。#864 CLOSED に伴い `unassigned-task/` から `completed-tasks/` へ移動済み |
| `unassigned-task/UT-29-cd-post-deploy-smoke-healthcheck.md` | 別物（汎用 HTTP healthcheck）。本タスクは authenticated `/admin` render gate に限定。重複なし |

## Step 2: 新規インターフェース（追加あり → 記録必須）

| インターフェース | 種別 | 場所 |
| ---------------- | ---- | ---- |
| `mintStagingSessionCookie(input)` | 新規関数 | `scripts/smoke/mint-staging-session-cookie.mts` |
| `MintSessionCookieInput` | 新規型 | 同上 |
| `cf.sh tail <worker> --env <e> --format json` | 新規 CLI subcommand | `scripts/cf.sh` |

> 本タスクの新規 IF は本仕様書 + implementation-guide.md + aiworkflow artifact inventory を正本導線とする。CI/smoke 層の横断索引は quick-reference / resource-map / task-workflow-active に同一 wave で追加済み。
