# Phase 2 成果物: U-UT01-08 / U-UT01-09 / UT-04 直交性チェックリスト

## 概要

本ドキュメントは AC-4（直交性維持）を満たす目的で、本タスク (U-UT01-07-FU01) が U-UT01-08（enum）/ U-UT01-09（retry/offset）/ UT-04（D1 schema 物理追加判定）のいずれにも踏み込まないことをチェックリスト形式で項目化する。

## U-UT01-08（#262 enum）委譲項目

本タスクは enum 値の canonical 決定を**一切行わない**。以下の項目はすべて U-UT01-08 で確定する。

- [x] `status` enum 値（`pending|in_progress|completed|failed` ↔ `running|success|failed|skipped` 等）の canonical 決定は **U-UT01-08 で確定**（本タスクで未決定）
- [x] `trigger_type` enum 値の canonical 決定は **U-UT01-08 で確定**（本タスクで未決定）
- [x] enum 値間の mapping（旧 → 新の変換規則）は **U-UT01-08 で確定**（本タスクで未決定）
- [x] enum を扱うコードレベルの型定義 (`type SyncStatus = ...`) の canonical 値は **U-UT01-08 で確定**（本タスクで未決定）

## U-UT01-09（#263 retry/offset）委譲項目

本タスクは retry / offset の値・意味論を**一切決定しない**。以下の項目はすべて U-UT01-09 で確定する。

- [x] `DEFAULT_MAX_RETRIES` の正本値は **U-UT01-09 で確定**（本タスクで未決定）
- [x] `processed_offset` の意味論（カウンタ単位、初期値、incremental 規則）は **U-UT01-09 で確定**（本タスクで未決定）
- [x] retry backoff 戦略（exponential / linear / jitter 等）は **U-UT01-09 で確定**（本タスクで未決定）
- [x] retry 上限到達時の handling 方針は **U-UT01-09 で確定**（本タスクで未決定）

## UT-04（D1 schema 物理追加判定）委譲項目

本タスクは D1 schema への物理カラム / INDEX 追加判定を**一切行わない**。以下の項目はすべて UT-04 で判定する。

- [x] `idempotency_key` カラム追加要否は **UT-04 で判定**（本タスクで未決定）
- [x] `processed_offset` カラム追加要否は **UT-04 で判定**（本タスクで未決定）
- [x] `sheets_revision` カラム追加要否は **UT-04 で判定**（本タスクで未決定）
- [x] `sync_locks.expires_at` の追加 INDEX 要否は **UT-04 で判定**（本タスクで未決定）
- [x] `sync_job_logs.status` の追加 INDEX 要否は **UT-04 で判定**（本タスクで未決定）
- [x] 物理 schema へのカラム / INDEX / FK / CONSTRAINT 追加判定全般は **UT-04 で判定**（本タスクで未決定）

## 本タスク自身の宣言（決定する／しないの明示）

### 本タスクが決定すること

- [x] 本タスクは canonical **名前** の UT-09 への引き渡し経路確定のみを扱う
- [x] 本タスクは UT-09 実装タスク root の path 確定（採択 = `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）を行う
- [x] 本タスクは canonical 名 (`sync_job_logs` / `sync_locks`) の引き渡し用必須参照リスト（親 #261 Phase 2 正本4ファイル絶対パス）を確定する
- [x] 本タスクは `sync_log` 物理化禁止のための grep ガード仕様（検証手段）を確定する
- [x] 本タスクは U-UT01-08 / U-UT01-09 / UT-04 への委譲項目を本チェックリストで明示する

### 本タスクが決定しないこと

- [x] 本タスクは enum 値（`status` / `trigger_type` 等）を**一切決定しない**
- [x] 本タスクは retry 値（`DEFAULT_MAX_RETRIES` 等）を**一切決定しない**
- [x] 本タスクは offset 意味論（`processed_offset` 等）を**一切決定しない**
- [x] 本タスクは物理 schema 追加判定（カラム / INDEX 追加）を**一切決定しない**
- [x] 本タスクは既存物理 migration / 既存 jobs コードを**一切改変しない**

## 自己 grep 検証

本ドキュメントおよび Phase 2 成果物 4 ファイル全体に対し、以下の決定文言が含まれていないことを grep で自己検証する。

| 検証項目 | 期待結果 |
| --- | --- |
| `DEFAULT_MAX_RETRIES = ...`（具体値の決定） | 0 件 |
| `status enum =`（具体値の決定） | 0 件 |
| `trigger_type enum =`（具体値の決定） | 0 件 |
| `idempotency_key を追加する`（物理追加の決定） | 0 件 |
| `processed_offset カラムを追加する`（物理追加の決定） | 0 件 |
| `sheets_revision カラムを追加する`（物理追加の決定） | 0 件 |
| `INDEX を追加する`（物理 INDEX 追加の決定） | 0 件 |

## AC-4 への対応

- U-UT01-08 / U-UT01-09 / UT-04 の責務境界を委譲項目として明文化
- 本タスクの決定する／しないを明示
- 直交タスクの担当者が「自分のスコープに侵食されていない」と確認できる構造
- → AC-4（直交性維持）満足

## 完了条件チェック

- [x] U-UT01-08 委譲項目が明文化
- [x] U-UT01-09 委譲項目が明文化
- [x] UT-04 委譲項目が明文化
- [x] 本タスクの決定する／しないを明示
- [x] 自己 grep 検証項目が記載
