# System Spec Update Summary — issue-922-production-admin-runtime-smoke-gate

## Step 1-A: タスク完了記録

- 本タスク root（`docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/`）を implemented_local_runtime_pending として作成。
- 親 #864（CLOSED）の Phase 12 unassigned-task-detection.md UT-CANDIDATE-1（production 展開）を **本タスクで formalize** した位置付け。

## Step 1-B: 実装状況テーブル

| 項目 | 状態 |
| ---- | ---- |
| 仕様書 | Phase 1-12 completed / workflow_state `implemented_local_runtime_pending` |
| 実装コード | 本 wave 実装済み（runner env-aware / mint env prefix / web-cd production job / focused tests）|
| runtime 検証 | `runtime_pending`（Gate-B: production deploy 実走 + 意図的 throw regression evidence + main required status check PUT）|

## Step 1-C: 関連タスクテーブル更新

| 関連 | 更新後ステータス |
| ---- | ---------------- |
| `completed-tasks/issue-864-admin-staging-runtime-smoke-ci-gate/` | staging gate 実装 + merge 済み。本タスクが production 展開 followup-001 |
| 親 #864 Phase 12 unassigned-task-detection.md `UT-CANDIDATE-1` | 本タスクで formalize（phase1-13 化）|
| `unassigned-task/UT-29-cd-post-deploy-smoke-healthcheck.md` | 別物（汎用 HTTP healthcheck）。本タスクは authenticated `/admin` render gate に限定。重複なし |

## Step 2: 新規インターフェース（追加あり → 記録必須）

| インターフェース | 種別 | 場所 |
| ---------------- | ---- | ---- |
| `resolveEnvPrefix(env: string): string` | 新規 export 関数（純粋関数）| `scripts/smoke/mint-staging-session-cookie.mts` |
| `RuntimeSmokeEnv = "staging" \| "production"` | 新規 type | 同上 |
| `runtime-admin-web.sh <staging\|production>` | 既存 CLI 引数 surface の拡張 | `scripts/smoke/runtime-admin-web.sh` |
| `admin-runtime-smoke-production` job | 新規 GitHub Actions job | `.github/workflows/web-cd.yml` |
| `production-runtime-smoke` GitHub Environment | 新規（user-gated 作成）| GitHub 設定 |

> 本タスクの新規 IF は本仕様書 + implementation-guide.md + aiworkflow artifact inventory を正本導線とする。CI/smoke 層の横断索引は quick-reference / resource-map / task-workflow-active に同一 wave で追加済み。
