# Phase 12 Task 2: システム仕様更新サマリ

## Step 1-A: タスク完了記録

| 項目 | 更新内容 |
| --- | --- |
| 完了タスク | u-04 Sheets → D1 sync implementation を implementation / NON_VISUAL として記録 |
| 関連ドキュメント | `architecture-overview-core.md`, `api-endpoints.md`, `environment-variables.md`, `deployment-cloudflare.md`, `quick-reference.md`, `resource-map.md`, `task-workflow-active.md` |
| LOGS | 現行 skill は `LOGS.md` ではなく `LOGS/_legacy.md` + fragment 運用。U-04 は `documentation-changelog.md` と aiworkflow-requirements changelog/lessons fragment に記録する |
| topic-map.md | 手動編集せず、正本ファイル追記後に `generate-index.js` で再生成する |

## Step 1-B: 実装状況テーブル更新

| 対象 | Before | After |
| --- | --- | --- |
| Sheets → D1 sync 実装 | UT-01 design / legacy endpoint のみ | u-04 実装として manual / scheduled / backfill / audit route を追加 |
| workflow state | `spec_created` | Phase 1-12 completed、Phase 13 pending |
| visual evidence | NON_VISUAL | NON_VISUAL 代替 evidence を `outputs/phase-11/evidence/non-visual-evidence.md` に実ファイル化 |

## Step 1-C: 関連タスク更新

| 関連タスク | 更新 |
| --- | --- |
| 05b smoke readiness | staging 実機 smoke を relay。u-04 は local / contract evidence まで |
| 09b cron monitoring | 30 分超 running alert / dashboard / cron operationalization を relay |
| U-05 D1 migration SQL | `sync_job_logs` / `sync_locks` 物理 schema owner として前提維持 |

## Step 1-D: 上流 runbook 差分判定

u-04 の runbook 差分は same-wave で `outputs/phase-12/runbook-final.md` と `cron-operations.md` に反映済み。
正本仕様には API / env / Cloudflare cron の current facts を反映し、staging deploy 実行手順は 05b / 09b に委譲する。

## Step 2: 正本仕様更新

| ファイル | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `/admin/sync/run`, `/admin/sync/backfill`, `/admin/sync/audit` を管理同期 API に追加 |
| `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | `apps/api/src/sync/` の sync layer 責務を Workers API ルート概要に追加 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `SHEETS_SPREADSHEET_ID`, `SYNC_RANGE`, `SYNC_MAX_RETRIES`, `SYNC_ADMIN_TOKEN` の u-04 用途を明確化 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | u-04 Cron Trigger `0 * * * *` と scheduled handler を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | u-04 実装導線を UT-01 直下に追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory に u-04 行を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `generate-index.js` による再生成対象 |

## 判定

PASS。新規 endpoint / Cron / env / audit writer は正本仕様へ反映済み。
