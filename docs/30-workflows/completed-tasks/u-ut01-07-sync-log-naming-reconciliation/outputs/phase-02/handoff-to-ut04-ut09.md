# UT-04 / UT-09 引き継ぎ + U-8 / U-9 直交性チェックリスト

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 対応 AC | AC-4 / AC-5 / AC-6 |

## 1. UT-04（D1 データスキーマ設計）への引き継ぎ

### 決定事項（本タスクで確定）

- **canonical 名**: `sync_job_logs`（ledger）+ `sync_locks`（lock）。両者は責務分離維持
- **既存物理の扱い**: `apps/api/migrations/0002_sync_logs_locks.sql` は read-only（改変禁止）
- **migration 戦略**: no-op（新規 migration 追加なし）。新規カラム追加が必要な場合のみ forward-only migration として追加
- **却下済戦略**: rename / DROP / 新テーブル+データ移行 はデータ消失リスクで明示却下済。UT-04 で再検討しない

### 未決定事項（UT-04 で判定すべき項目）

| # | 項目 | 内容 | 判定指針 |
| --- | --- | --- | --- |
| 1 | `idempotency_key` カラム追加要否 | 重複実行防止に `run_id` で十分か外部冪等キーが別途必要か | UT-09 の冪等性要件を確定後に追加要否判定 |
| 2 | `processed_offset` カラム追加要否 | 差分同期 resume のための進捗記録 | UT-01 / UT-09 で resume 戦略確定後に判定（**意味論は U-9 委譲**） |
| 3 | `sheets_revision` カラム追加要否 | Sheets schema バージョン捕捉 | `schema_diff_queue` で代替可能か検証後に判定 |
| 4 | `sync_locks` の追加 INDEX | `expires_at` への INDEX が必要か（stale lock 検出 SQL の頻度次第） | UT-09 のクエリパターン確定後に判定 |

### UT-04 着手前提条件

- 本ドキュメント（`naming-canonical.md` / `column-mapping-matrix.md` / `backward-compatibility-strategy.md` / 本ファイル）を UT-04 Phase 1 参照資料に必須登録
- 新規 migration を追加する場合は、命名規約 `NNNN_<verb>_<target>.sql` に従い、既存 `0002_sync_logs_locks.sql` を改変しない

## 2. UT-09（Sheets→D1 同期ジョブ実装）への引き継ぎ

### 決定事項

- **実装で参照する canonical 名**: `sync_job_logs` / `sync_locks` のみ
- **論理 `sync_log` 表記**: コード内で使用しない。コメントや変数名で `syncLog` を使う場合は責務（ledger / lock のどちらか）を明示
- **既存実装 `apps/api/src/jobs/sync-sheets-to-d1.ts`**: 本タスクで改変しない（UT-09 のスコープ）

### UT-09 への確認事項

- [ ] lock 取得 / 解放ロジックは `sync_locks` テーブルに対してのみ操作
- [ ] ledger 書き込みは `sync_job_logs` テーブルに対してのみ操作
- [ ] enum 値（status / trigger_type）の正本確定は **U-8 完了を待つ**
- [ ] retry / offset 値の正本確定は **U-9 完了を待つ**

## 3. U-8 / U-9 直交性チェックリスト

本タスク（U-UT01-07）が **侵食していないこと** をチェックリスト形式で確認する。

### U-8（sync 状態 enum / trigger enum 統一）との直交性

- [x] 本タスクは `status` enum 値（`pending|in_progress|completed|failed` ↔ `running|success|failed|skipped`）の canonical を**決定しない**
- [x] 本タスクは `trigger_type` enum 値（`cron|admin|backfill` 等）の canonical を**決定しない**
- [x] 本タスクは enum 値の表記揺れ（snake_case / kebab-case）を**決定しない**
- [x] マッピング表（`column-mapping-matrix.md`）でも該当箇所に「**U-8 委譲**」ラベルを付与

### U-9（retry 回数 / offset resume 統一）との直交性

- [x] 本タスクは `DEFAULT_MAX_RETRIES` の正本値を**決定しない**
- [x] 本タスクは `processed_offset` の意味論（行番号 / timestamp / cursor）を**決定しない**
- [x] 本タスクは retry 戦略（指数バックオフ / 線形）を**決定しない**
- [x] マッピング表（`column-mapping-matrix.md`）でも該当箇所に「**U-9 委譲**」ラベルを付与

### 本タスクのスコープ宣言（再掲）

- [x] 本タスクは命名 reconciliation のみを扱う
- [x] 本タスクは canonical 名・マッピング表・後方互換戦略の文書契約を提供する
- [x] 本タスクは DDL 発行 / migration 追加 / コード変更を**含まない**

## 4. システム仕様 drift 解消（AC-6）

### grep 確認結果

- 確認対象: `.claude/skills/aiworkflow-requirements/references/database-schema.md`
- 確認パターン: `sync_log` / `sync_job_logs` / `sync_locks`
- 確認結果（Phase 1 時点で実施）: **言及なし（grep ヒット 0 件）**
- 判定: **drift 解消の追補不要**

### 判定理由

`database-schema.md` には現時点で sync 系テーブル（`sync_log` / `sync_job_logs` / `sync_locks`）への直接言及が存在しない。したがって本タスクで提案する canonical 名（`sync_job_logs` / `sync_locks`）は仕様側に追加記述するか、UT-04 完了時に database-schema.md 全体更新の中で統合するかを **UT-04 で判定** する。本タスクでは追補なしで完了する。

### 不要明記

- [x] `database-schema.md` は本タスクでは更新不要（grep 結果ゼロのため）
- [x] UT-04 着手時に sync 系テーブルを `database-schema.md` に追補する場合は、本タスクの canonical 名に従うこと

## 5. 関連タスク参照表

| 関連タスク | 種別 | 関係 |
| --- | --- | --- |
| UT-01 | 上流 | 論理設計 `sync_log` の出典。本タスクで概念名に降格決定 |
| UT-04 | 下流 | migration 計画の受け取り側。本ドキュメントを Phase 1 参照資料必須化 |
| UT-09 | 下流 | 実装で canonical 名を参照 |
| U-8 | 直交 | enum 値の canonical 決定（本タスク非関与） |
| U-9 | 直交 | retry / offset 値の canonical 決定（本タスク非関与） |
| UT-21 | 関連 | 監査 endpoint。`sync_job_logs` を読み取り対象とする |
