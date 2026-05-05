# Phase 2 成果物: canonical 名引き渡しリファレンス表

## 概要

本ドキュメントは AC-2（canonical 名引き渡し）を満たす目的で、UT-09 実装が参照すべき canonical 名と、そのソースとなる親 #261 (U-UT01-07) Phase 2 正本4ファイルを明示する。

## canonical 表（実装で参照する正本名）

| 名前 | 種別 | 物理／概念 | 責務 | 出典 |
| --- | --- | --- | --- | --- |
| `sync_job_logs` | テーブル | 物理 | ledger（実行履歴・status・retry_count・duration_ms 等） | `apps/api/migrations/0002_sync_logs_locks.sql` |
| `sync_locks` | テーブル | 物理 | lock（同時実行制御・expires_at） | `apps/api/migrations/0002_sync_logs_locks.sql` |
| `sync_log` | 概念名 | **物理化禁止** | UT-01 設計上の論理用語。コードへ物理名として降ろさない。`CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME TO sync_log` / `DROP TABLE sync_job_logs` を禁止 | `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md` |

## 必須参照リスト（UT-09 タスク Phase 1 へ登録すべき絶対パス4件）

UT-09 実装タスク（採択 path = `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）の Phase 1 必須参照欄に、以下 4 ファイルの**絶対パス**を登録すること。

| # | 絶対パス | 引き渡す canonical 値 / 設計情報 |
| --- | --- | --- |
| 1 | `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md` | canonical 名採択（案 A: `sync_job_logs` / `sync_locks` / `sync_log` 物理化禁止） |
| 2 | `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md` | 1:N カラムマッピング表（論理 → 物理） |
| 3 | `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md` | no-op 後方互換戦略（既存物理に変更を加えない） |
| 4 | `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md` | UT-04 / UT-09 への引き継ぎ事項 + 直交性チェックリスト |

## 物理／概念区分の明記

- **物理（テーブルとして存在）**: `sync_job_logs`, `sync_locks`
  - `apps/api/migrations/0002_sync_logs_locks.sql` で定義済
  - `apps/api/src/jobs/sync-sheets-to-d1.ts` で既に canonical 名を使用中（line 313, 337, 369 で確認済）
- **概念（テーブルとして存在しない）**: `sync_log`
  - UT-01 設計上の論理用語
  - 物理化（CREATE / RENAME / DROP）禁止

## aiworkflow-requirements drift 確認

- `.claude/skills/aiworkflow-requirements/references/database-schema.md` の sync 系記述を grep で確認
- 確認結果: canonical 名 `sync_job_logs` を使用しており、**drift なし**
- doc-only 更新は不要

## AC-2 への対応

- canonical 名 `sync_job_logs` / `sync_locks` を canonical 表 3 行で明示
- 親 #261 Phase 2 正本4ファイルの絶対パスを必須参照リストとして列挙
- UT-09 実装タスクの Phase 1 必須参照欄および AC に反映する経路を本表で確定
- → AC-2（canonical 名引き渡し）満足

## 完了条件チェック

- [x] canonical 表 3 行（`sync_job_logs` / `sync_locks` / `sync_log` 概念名注釈）が記載
- [x] 物理／概念区分が明記
- [x] 親 #261 Phase 2 正本4ファイル絶対パスが列挙
- [x] 各ファイルの引き渡す canonical 値が表形式で明記
- [x] aiworkflow-requirements drift 確認結果を記録
