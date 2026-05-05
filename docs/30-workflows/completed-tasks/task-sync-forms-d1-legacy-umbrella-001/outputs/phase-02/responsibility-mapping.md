# Phase 02: 責務移管マッピング詳細（旧 UT-09 → 03a / 03b / 04c / 09b / 02c）

## 目的

旧 UT-09「Sheets→D1 同期ジョブ実装」の責務を現行タスクへ完全分散吸収し、direct 残責務 0 件を表で確定する（AC-2）。

## 詳細マッピング表

| # | 旧 UT-09 の責務 | 受け手タスク | 受け手 Phase / 成果物 | D1 / API / 設定 | 旧前提 | 新前提 | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | schema 取得・upsert | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | 03a Phase 5 / schema sync 関数 | `schema_versions` / `schema_questions` / `schema_diff_queue` | Sheets API v4 + 固定 schema | `forms.get`（動的）+ stableKey alias queue | 不変条件 #1 を維持 |
| 2 | response 取得・cursor pagination | 03b-parallel-forms-response-sync-and-current-response-resolver | 03b Phase 5 / response sync 関数 | `member_responses` / `member_identities` / `member_status` | `spreadsheets.values.get` | `forms.responses.list` + cursor | consent snapshot 同時記録 |
| 3 | current response resolver | 03b | 03b Phase 5 / current resolver | `member_responses` 最新行 | なし | 同一 `responseId` の最新 1 件を resolve | 不変条件 #7 |
| 4 | consent snapshot（`publicConsent` / `rulesConsent`） | 03b | 03b Phase 5 | response 取得時点で凍結 | system field 扱いなし | system field として保存 | specs/01-api-schema.md に従う |
| 5 | 手動 sync trigger | 04c-parallel-admin-backoffice-api-endpoints | 04c Phase 5 / admin gate + endpoint | `POST /admin/sync/schema` / `POST /admin/sync/responses` | 単一 `/admin/sync` | 分割 2 endpoint | 04c が admin gate 適用 |
| 6 | cron schedule | 09b-parallel-cron-triggers-monitoring-and-release-runbook | 09b Phase 5 / wrangler.toml `[triggers]` | `*/15 * * * *`（response）/ `0 3 * * *`（schema） | GAS / Sheets cron 想定 | Workers Cron Triggers | 不変条件 #6 |
| 7 | cron pause / resume / evidence | 09b | 09b Phase 5 / runbook、Phase 11 / evidence | wrangler / Cloudflare dashboard | アドホック | runbook 化 | AC-7 |
| 8 | monitoring / alert | 09b + observability guardrails | 09b Phase 12 release-runbook | Cloudflare Analytics / Sentry | 個別 | 共通 observability | DSN は placeholder |
| 9 | D1 contention / WAL 非前提 / retry / backoff | 03a / 03b 異常系 + 09b runbook | 03a Phase 6 / 03b Phase 6 / 09b Phase 6 | retry/backoff、短い transaction、batch-size 制限 | PRAGMA WAL 前提 | WAL 非前提 + retry/backoff | OQ-2 不採用確定 |
| 10 | 同種 job 排他 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | 02c Phase 5 / `sync_jobs` repository | `sync_jobs.status='running'` | アプリ mutex | D1 行排他 + 409 Conflict | AC-6 |
| 11 | 監査履歴 | 02c | 02c Phase 5 | `sync_jobs` テーブル | `sync_audit` | `sync_jobs` | OQ-1 で `sync_jobs` を新正本確定 |
| 12 | secret 配備 | インフラ + 03a/03b 利用 | Cloudflare Secrets | `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` | Sheets 用 OAuth | Service Account | apps/api のみが参照 |
| 13 | apps/web→D1 直接禁止境界 | 02c | 02c Phase 5 / data access boundary | -（境界） | 境界規定なし | apps/api 経由のみ | 不変条件 #5 |

## direct 残責務集計

| 種別 | 件数 |
| --- | --- |
| 03a へ移管 | 1, 2 系（schema） |
| 03b へ移管 | 2, 3, 4 系（response / current / consent） |
| 04c へ移管 | 5（admin endpoint） |
| 09b へ移管 | 6, 7, 8, 9 系（cron / runbook / monitoring / contention runbook 部） |
| 02c へ移管 | 10, 11, 13（job 排他 / 履歴 / 境界） |
| インフラへ | 12（secret 配備） |
| 本タスクに残る direct 責務 | **0 件** |

**結論: direct 残責務 0 件（AC-2 PASS）**

## 旧 UT-09 §4 Phase 構成 ↔ 現行タスクの対応

| 旧 UT-09 Phase | 元責務 | 受け手 |
| --- | --- | --- |
| Phase 1 stale 前提棚卸し | Sheets→Forms / `/admin/sync` → `/admin/sync/{schema,responses}` / `sync_audit` → `sync_jobs` / `dev/main` 表記の正規化 | 本タスク Phase 02 stale↔正本表 |
| Phase 2 責務移管確認 | 03a/03b/04c/09b/02c への割当 | 本タスク Phase 02 責務移管表（このファイル） |
| Phase 3 品質要件移植 | retry/backoff / 短 transaction / batch-size 制限 / 二重起動防止 | 03a Phase 6 / 03b Phase 6 / 09b Phase 6 / 02c Phase 5 |
| Phase 4 監査検証 | filename / 必須 9 セクション / lowercase / hyphen | 本タスク Phase 09 品質保証 |

## 移管要件チェックリスト

- [x] schema 取得が `forms.get` 動的取得で 03a に集約（#1 不変条件適合）
- [x] response 取得が `forms.responses.list` で 03b に集約（#7 不変条件適合）
- [x] 手動 trigger が `/admin/sync/schema` と `/admin/sync/responses` の 2 endpoint で 04c に集約（AC-4）
- [x] cron が Workers Cron Triggers で 09b に集約（#6 不変条件適合）
- [x] `sync_jobs.status='running'` 排他で 02c に集約、二重時 409 Conflict（AC-6）
- [x] D1 競合対策（SQLITE_BUSY retry/backoff / batch-size / 短い tx）が 03a / 03b 異常系へ移植要件として明記（AC-5）
- [x] secret は apps/api のみ参照（apps/web→D1 直接禁止 = 不変条件 #5 整合）
- [x] stale ディレクトリ `ut-09-sheets-to-d1-cron-sync-job/` を新設しない（AC-12）

## 参照

- `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md`
- 03a / 03b / 04c / 09b / 02c の `index.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` / `task-workflow.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md` / `03-data-fetching.md` / `08-free-database.md`
