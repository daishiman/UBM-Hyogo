# 論理 13 カラム → 物理 1:N マッピングマトリクス

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 対応 AC | AC-2 |

## 1. 翻訳ルール

- **論理 1 行 → 物理 N 行 / 0 行** の N:M 対応を許容する
- 物理側責務テーブルを必ず明示（ledger 系 = `sync_job_logs` / lock 系 = `sync_locks`）
- 判定ラベル:
  - **実装済**: 物理側に同義カラム存在
  - **物理未実装→UT-04 委譲**: 論理側に存在し物理側に未実装。追加要否判定は本タスク対象外（UT-04 へ委譲）
  - **不要**: 概念上は論理に書かれていたが物理に持ち込まない判定
  - **責務分離**: 論理 1 カラムが物理側で別テーブルに分離

## 2. マッピング表（論理 13 カラム想定）

> 論理 13 カラムは UT-01 Phase 2 `sync-log-schema.md` の想定に基づく。物理側は `apps/api/migrations/0002_sync_logs_locks.sql` の実装より抽出。

| # | 論理カラム（`sync_log`） | 物理対応テーブル.カラム | 判定 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | id | `sync_job_logs.id` (INTEGER PK AUTOINCREMENT) | 実装済 | 論理は概念上の primary surrogate を想定、物理は INTEGER AUTOINCREMENT |
| 2 | run_id | `sync_job_logs.run_id` (TEXT UNIQUE) | 実装済 | UNIQUE 制約付き、idempotency の最重要キー |
| 3 | trigger_type | `sync_job_logs.trigger_type` + `sync_locks.trigger_type` | 実装済（責務両側） | enum 値の canonical 決定は **U-8 委譲**（cron / admin / backfill） |
| 4 | status | `sync_job_logs.status` (TEXT) | 実装済 | enum 値（`running`/`success`/`failed`/`skipped`）の canonical は **U-8 委譲** |
| 5 | started_at | `sync_job_logs.started_at` (TEXT ISO8601) | 実装済 | - |
| 6 | finished_at | `sync_job_logs.finished_at` (TEXT) | 実装済 | nullable（実行中は NULL） |
| 7 | fetched_count | `sync_job_logs.fetched_count` (INTEGER NOT NULL DEFAULT 0) | 実装済 | - |
| 8 | upserted_count | `sync_job_logs.upserted_count` (INTEGER NOT NULL DEFAULT 0) | 実装済 | - |
| 9 | failed_count | `sync_job_logs.failed_count` (INTEGER NOT NULL DEFAULT 0) | 実装済 | - |
| 10 | retry_count | `sync_job_logs.retry_count` (INTEGER NOT NULL DEFAULT 0) | 実装済 | `DEFAULT_MAX_RETRIES` の正本化は **U-9 委譲** |
| 11 | duration_ms | `sync_job_logs.duration_ms` (INTEGER) | 実装済 | nullable |
| 12 | error_reason | `sync_job_logs.error_reason` (TEXT) | 実装済 | 論理側は `error_message` 表記の場合あり、本決定で `error_reason` を canonical 化 |
| 13 | lock_expires_at | `sync_locks.expires_at` (TEXT ISO8601 NOT NULL) | 責務分離（lock 系） | 論理 1 カラム → 物理 lock テーブル側 |

## 3. 論理側にあって物理に未実装のカラム（UT-04 委譲判定）

論理 13 カラムには明示されていないが、UT-01 Phase 12 で議論された候補:

| 候補カラム | 論理上の意図 | 物理現状 | UT-04 への委譲事項 |
| --- | --- | --- | --- |
| idempotency_key | 重複実行防止のための外部 ID（cron / admin の冪等性キー） | 物理未実装（`sync_locks.id` は lock 名で兼用） | **UT-04 で追加要否判定**。`run_id` と独立に必要か検討 |
| processed_offset | resume 用の進捗 offset（差分同期の中断再開） | 物理未実装 | **UT-04 で追加要否判定**。意味論（行番号 / timestamp / cursor）は **U-9 委譲** |
| sheets_revision | Sheets 側 schema バージョン捕捉 | 物理未実装 | **UT-04 で追加要否判定**。schema_diff_queue で代替可能性あり |

## 4. 物理側にあって論理にないカラム

| 物理カラム | 物理テーブル | 論理側未記載の理由 | 判定 |
| --- | --- | --- | --- |
| `sync_locks.acquired_at` | `sync_locks` | 論理は `lock_expires_at` のみ記載。lock 取得時刻は派生情報 | 実装済（保持） |
| `sync_locks.holder` | `sync_locks` | 論理側は `holder_id` 名想定。物理は `holder` のみ | canonical は `holder`（命名統一） |
| `sync_job_logs` の各 INDEX（idx_sync_job_logs_started / idx_sync_job_logs_status） | `sync_job_logs` | 論理は index 設計を含まず | 実装済（保持） |

## 5. 網羅性チェック

- [x] 論理 13 カラム全てがマッピング表に登場（漏れ 0）
- [x] 全行に判定ラベルあり（空欄 0）
- [x] 物理側の全カラム（`sync_locks` 5 個 + `sync_job_logs` 12 個）が表中に登場
- [x] 物理 INDEX 2 個も §4 に記載
- [x] U-8 / U-9 委譲ラベルが該当箇所に明示

## 6. UT-04 / UT-09 への引き継ぎ要点

- canonical 名は `sync_job_logs` + `sync_locks`（responsibility 分離維持）
- 物理未実装候補（idempotency_key / processed_offset / sheets_revision）は **UT-04 が追加要否を判定**。本タスクでは追加 DDL を発行しない
- enum 値（trigger_type / status）の canonical は **U-8** へ
- retry / offset の数値・意味論は **U-9** へ
