# Contract Sync Check — 5 文書 × 5 観点 マトリクス

正本: `../../phase-09.md`
サマリー: `./main.md`
AC トレース: AC-6（5 文書同期チェックの Phase 9 実施）
タスク種別: docs-only / direction-reconciliation / NON_VISUAL

採用 base case = **案 A（Forms 分割方針）** に対し、5 文書を実 Read して endpoint / ledger / Secret / Cron / responsibility の 5 観点で同期チェックを実施した記録。

## 0. 検証対象 5 文書

| # | 略称 | 実 path | Read 済み |
| --- | --- | --- | --- |
| 1 | legacy umbrella | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | YES |
| 2 | 03a | `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | YES |
| 3 | 03b | `docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | YES |
| 4 | 04c | `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` | YES |
| 5 | 09b | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | YES |

## 1. 5 文書 × 5 観点 マトリクス（実態）

| 文書 | endpoint | ledger | Secret | Cron | responsibility |
| --- | --- | --- | --- | --- | --- |
| legacy umbrella | `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint を正、単一 `/admin/sync` は stale | `sync_jobs` を正、`sync_audit` は stale | `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` を依存に明記 | 09b runbook 経路を明記 | 旧 UT-09 を direct implementation にせず 03a / 03b / 04c / 09b に分解 |
| 03a | `POST /admin/sync/schema`（schema sync 専任 entry point） | `sync_jobs`（kind=schema_sync 想定 / running→succeeded/failed） | `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` を Cloudflare Secrets に明記 | 1 日 1 回 cron 起動（schema sync） | Forms schema sync + stableKey alias queue 専任 |
| 03b | `POST /admin/sync/responses`（response sync 専任 job 関数） | `sync_jobs`（kind=response_sync）+ `member_responses` / `member_identities` / `member_status` 更新 | `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` を Cloudflare Secrets に明記 | cron 15 分毎（response sync）+ 手動 | Forms response sync + current response resolver + consent snapshot 専任 |
| 04c | `POST /admin/sync/schema` + `POST /admin/sync/responses` を admin gate 配下で expose（202 + job_id 返却 / 重複 trigger は 409） | `sync_jobs` + `audit_log` 書き込み | 04c 自身は新規 secret なし（認証 secret は 05a / 05b に委譲、`SYNC_ADMIN_TOKEN` は admin gate middleware が管理） | N/A | admin endpoint 契約の正本（dashboard / members / notes / tags / schema / meetings / sync trigger） |
| 09b | scheduled handler が 2 endpoint を順次叩く / `sync_jobs` 排他で二重起動防止 | `sync_jobs` の `running` レコード参照（spec/03-data-fetching.md 準拠） | 09b 自身は SENTRY_DSN placeholder のみ（runtime は env binding） | `[triggers] crons = ["*/15 * * * *", "0 3 * * *"]` 正本固定 | cron + monitoring + release/incident runbook |

## 2. 観点別 整合判定（5 文書全体）

| 観点 | reconciliation 結論（案 A） | 5 文書整合判定 | drift |
| --- | --- | --- | --- |
| endpoint | `POST /admin/sync/schema` + `POST /admin/sync/responses` 2 endpoint | 一致 | なし |
| ledger | `sync_jobs` 単一 | 一致 | なし |
| Secret | Forms 系 3 件（`GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID`）+ 共通（`SYNC_ADMIN_TOKEN` / `ADMIN_ROLE_EMAILS`）/ Sheets 系廃止候補 | 一致（Sheets 系の正本登録なし） | なし |
| Cron | response sync `*/15 * * * *` / schema sync `0 3 * * *`（or 1 日 1 回） | 一致（03a「1 日 1 回」 ↔ 09b「`0 3 * * *`」は等価表記） | なし |
| responsibility | schema=03a / response=03b / endpoint=04c / cron+runbook=09b / legacy=umbrella | 一致 | なし |

## 3. Forms 分割方針（A）整合チェック

| チェック項目 | 期待 | 実態 | 判定 |
| --- | --- | --- | --- |
| 上流 API | Google Forms API（`forms.get` + `forms.responses.list`） | 03a: `forms.get` / 03b: `forms.responses.list` | PASS |
| endpoint 分割 | 2 endpoint | 5 文書とも 2 endpoint | PASS |
| ledger 単一化 | `sync_jobs` のみ | 5 文書とも `sync_jobs` のみ | PASS |
| 同種 job 排他 | `sync_jobs.status='running'` で 409 | 03a AC-6 / 03b AC-6 / 04c AC-10 / 09b AC-6 で明記 | PASS |
| schema 集約 | `/admin/schema/*` に集約（不変条件 #14） | 04c AC-7 で明記 | PASS |

## 4. Sheets 残骸チェック

| チェック | 結果 |
| --- | --- |
| `Sheets` / `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` の 03a / 03b / 04c / 09b 内出現 | 0 件 |
| `sync_locks` / `sync_job_logs` の 5 文書内出現 | 0 件 |
| 単一 `/admin/sync` endpoint 採用記述 | 0 件（legacy umbrella のみ stale 撤回文脈で言及） |
| `sync_audit` 採用記述 | 0 件（legacy umbrella のみ stale 撤回文脈で言及） |

> legacy umbrella spec の Sheets 言及はすべて「stale 前提として撤回 / Forms へ置換」文脈であり、正本としての Sheets 採用記述ではない。

## 5. 参照 path drift（contract 外の軽微差分）

| # | 文書 | 仕様書記載 path | 実 path | 影響 | 対応 |
| --- | --- | --- | --- | --- | --- |
| 1 | 03a | `docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/` | `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/` | 参照 path のみ。endpoint / ledger / Secret / Cron / responsibility 変更なし | 別タスクで path 更新 |
| 2 | 09b | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/`（一部参照で省略形） | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/` | 参照表記の混在 | 別タスクで参照統一 |

> 上記 2 件は contract レベル drift 0 件の判定に影響しない。

## 6. 最終判定

5 文書 × 5 観点（25 セル）すべて **PASS**。
契約レベルの drift 0 件、参照 path 表記の軽微な drift 2 件（別タスクで解消）。
Phase 10 GO/NO-GO ゲートへ「contract sync 全 PASS / 別タスク化対象 = path 表記更新 2 件のみ」として引き渡す。

状態: spec_created
