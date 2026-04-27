# Phase 1 成果物 — 要件定義

## 1. スコープ確定

UT-09 は Cloudflare Workers Cron Triggers を用いた Sheets→D1 同期パイプラインを `apps/api` 内で完結させる実装タスクである。`scheduled()` ハンドラと `POST /admin/sync` の双方が同一の `runSync()` core を呼び出し、WAL 非前提の競合対策（retry/backoff・write queue 直列化・短い transaction・batch-size 100 上限）を内包する。

## 2. 真の論点と採用方針

| 論点 | 採用方針 |
| --- | --- |
| 同期方式 | pull (cron) を主体、admin endpoint で手動補完 (UT-01 設計に準拠) |
| 競合制御 | `sync_locks` TTL 付き lock + WriteQueue 直列化 + with-retry exponential backoff |
| エラー分類 | 5xx / SQLITE_BUSY = retryable / 4xx = non-retryable |
| 大容量行 | A1 range builder + 100 行 chunk による pagination |
| 冪等性 | `INSERT ... ON CONFLICT(response_id) DO UPDATE` |
| Schema 拡張余地 | 未知列は `extra_fields_json` / `unmapped_question_ids_json` に退避 (不変条件 #1) |
| 認証 | Service Account JWT を WebCrypto で生成 (Workers ランタイム互換) |

## 3. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Form 回答を D1 に同期し、API/UI が常に最新データへアクセス可能 |
| 実現性 | PASS | Cloudflare Workers Cron Triggers / D1 / Sheets API はすべて無料枠で動作 |
| 整合性 | PASS | 不変条件 #1 #4 #5 と整合。`apps/api` 内に閉じ、Sheets schema を固定しない |
| 運用性 | PASS | `sync_job_logs` で run_id 単位の追跡可能、TTL ロックで二重起動防止 |

## 4. 命名規則チェックリスト

- 同期 lock id: `sheets-to-d1`（小文字 + ハイフン）
- run_id: `crypto.randomUUID()`
- module 名: `apps/api/src/jobs/sync-sheets-to-d1.ts`
- admin endpoint: `POST /admin/sync` (Bearer `SYNC_ADMIN_TOKEN`)
- environment 変数: SCREAMING_SNAKE_CASE (`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SYNC_ADMIN_TOKEN`)

## 5. AC 引き渡し

AC-1〜AC-11 を Phase 7 のマトリクスへ引き渡す。本フェーズで blocker は検出されず、Phase 2 (設計) へ進行可能。
