# Phase 12 — システム仕様同期サマリー

UT-09 (Sheets→D1 同期ジョブ) の実装に伴う仕様書連動内容。初期仕様では `spec_created / docs_only` としていたが、実コード・migration・test が追加済みのため、close-out では `implemented / docs_only=false` に再判定した。

ただし、現行正本の `task-sync-forms-d1-legacy-umbrella-001` は旧 UT-09 を direct implementation として扱わず、Google Forms API / `/admin/sync/schema` / `/admin/sync/responses` / `sync_jobs` へ責務分割する方針を定義している。したがって、Sheets API v4 / 単一 `/admin/sync` / `sync_locks` / `sync_job_logs` を aiworkflow-requirements の正本へ登録する同期は実施しない。PR 前に「旧 Sheets 実装を撤回する」または「legacy umbrella と現行 03a/03b/04c/09b 正本を更新して Sheets 実装を採用する」のどちらかを決める必要がある。

## 影響を受ける仕様

| 領域 | 現状 | 本タスクで何が変わったか |
| --- | --- | --- |
| `apps/api` ランタイム境界 | Hono on Workers | `scheduled()` ハンドラを追加。`/admin/sync` route を新設 |
| D1 スキーマ | UT-04 で定義 | `sync_locks` / `sync_job_logs` の 2 テーブルを追加 (migration 0002) |
| Secret 一覧 | OP / Cloudflare Secrets | `GOOGLE_SHEETS_SA_JSON` / `SYNC_ADMIN_TOKEN` を追加 |
| 環境変数 | `wrangler.toml [vars]` | `SHEETS_SPREADSHEET_ID` / `SYNC_BATCH_SIZE` / `SYNC_MAX_RETRIES` / `SYNC_RANGE` を追加 |
| Cron schedule | 既存なし | production `0 */6 * * *` / staging `0 * * * *` |

## 不変条件への影響

| # | 不変条件 | 影響 |
| --- | --- | --- |
| #1 | 実フォーム schema をコードに固定しすぎない | mapper はヘッダ駆動、未知列は `extra_fields_json` に退避 |
| #4 | Form schema 外データは admin-managed として分離 | `member_responses` のみ sync 対象、`admin_overrides` は触らない |
| #5 | D1 直接アクセスは `apps/api` に閉じる | sync は apps/api 内の jobs/ で完結 |

## 関連スキル / ドキュメント

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` — cron / triggers の方針
- `.claude/skills/aiworkflow-requirements/references/database-schema.md` — D1 拡張表
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` — `/admin/sync`

## Phase 12 Step 1-A / 1-B / 1-C / Step 2 判定

| Step | 判定 | 反映 |
| --- | --- | --- |
| 1-A 完了記録 | DONE | workflow outputs、LOGS、正本仕様更新対象を記録 |
| 1-B 実装状況 | DONE | task ledger を `implemented` / `docs_only=false` に補正 |
| 1-C 関連タスク | BLOCKED | UT-07 / UT-08 / UT-10 / UT-26 以前に、legacy umbrella との方針衝突を解消する必要あり |
| Step 2 | BLOCKED | 現行正本と衝突するため `POST /admin/sync`、`sync_locks` / `sync_job_logs`、Sheets Cron Triggers は正本登録しない |

## 実機 smoke の扱い

staging 実機 smoke は `GOOGLE_SHEETS_SA_JSON` / `SYNC_ADMIN_TOKEN` / Cloudflare D1 が必要なため、このワークツリー内では自動テスト 22 件と手順整備までを完了条件とする。実機 `wrangler dev --test-scheduled`、`/__scheduled`、`POST /admin/sync`、D1 SELECT 証跡は UT-26 staging-deploy-smoke で採取する。
