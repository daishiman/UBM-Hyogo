# Phase 2 成果物: コード変更スコープ + grep ガード仕様

## 概要

本ドキュメントは AC-3（`sync_log` 物理化禁止の明記）を満たす目的で、UT-09 実装が触るべきファイル / ディレクトリの境界を明示し、本タスクが既存物理コードを改変しないことを再宣言し、grep ガード仕様を定義する。

## コード変更スコープ表

| ファイル / ディレクトリ | 目的 | 変更種別 | 担当タスク | 本タスクのアクション |
| --- | --- | --- | --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | 既存ジョブの canonical 名 (`sync_job_logs` / `sync_locks`) 参照確認 | read-only 検証 | UT-09 | grep で既に canonical 名利用を確認（line 313, 337, 369）、AC-3 grep ガード対象。本タスクは改変しない。 |
| `apps/api/src/sync/`（新規ディレクトリ提案） | sync ジョブ補助モジュール（lock 管理 / ledger 書込みヘルパ） | 新規 | UT-09 | ディレクトリ構造提案のみ。実装は UT-09。 |
| grep ガード（CI / hook） | `CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME` が 0 件であること | 新規（任意） | UT-09 | 検証手段として AC-3 に明示。実装は UT-09。 |
| `apps/api/migrations/0002_sync_logs_locks.sql` | 物理現状 | **read-only / 改変禁止** | （誰も触らない） | 改変禁止を本タスクで再宣言。 |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | システム仕様 doc | doc-only 更新可（drift 解消が必要な場合のみ） | aiworkflow-requirements skill | 本確認時点で drift なし。更新不要。 |

## 本タスクの改変禁止宣言

本タスク (U-UT01-07-FU01) は **docs-only** タスクであり、以下のファイルを**改変しない**ことを明示する:

- `apps/api/migrations/0002_sync_logs_locks.sql`（既存物理 schema）
- `apps/api/src/jobs/sync-sheets-to-d1.ts`（既存実装）
- `apps/api/migrations/**` 配下の任意の SQL ファイル
- `apps/api/src/**` 配下の任意の TypeScript ファイル

本タスクの成果物は `docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/**` に閉じる。コード本体への変更はすべて UT-09 実装タスク（採択 path = `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）に委譲する。

## grep ガード仕様

UT-09 実装タスクで CI / lefthook hook に組み込む grep ガードの仕様を以下に定義する。AC-3 検証手段として明示する。

### 禁止文言（0 件であることを保証）

| # | 禁止文言（正規表現） | 検出対象 | 説明 |
| --- | --- | --- | --- |
| 1 | `CREATE\s+TABLE\s+sync_log\b` | `apps/api/migrations/**.sql`, `apps/api/src/**` | 概念名 `sync_log` を物理テーブルとして作成する記述を禁止 |
| 2 | `ALTER\s+TABLE\s+sync_job_logs\s+RENAME\s+TO\s+sync_log\b` | `apps/api/migrations/**.sql` | canonical 名 `sync_job_logs` から概念名 `sync_log` への rename を禁止 |
| 3 | `DROP\s+TABLE\s+sync_job_logs\b` | `apps/api/migrations/**.sql` | canonical 名 `sync_job_logs` の削除を禁止 |

### 許可される記述

- `sync_job_logs` をテーブル参照として使用するコード／SQL（INSERT / SELECT / UPDATE 等）
- `sync_locks` をテーブル参照として使用するコード／SQL
- ドキュメント（`.md`）内での `sync_log`（概念名としての言及）の使用
- コメント内での「`sync_log` は概念名」等の説明的記述

### grep コマンド例（UT-09 実装で CI に組み込む参考）

```bash
# 1. CREATE TABLE sync_log を検出（許可ファイルを除外）
grep -rE 'CREATE\s+TABLE\s+sync_log\b' apps/api/migrations apps/api/src && exit 1 || true

# 2. ALTER TABLE sync_job_logs RENAME TO sync_log を検出
grep -rE 'ALTER\s+TABLE\s+sync_job_logs\s+RENAME\s+TO\s+sync_log\b' apps/api/migrations && exit 1 || true

# 3. DROP TABLE sync_job_logs を検出
grep -rE 'DROP\s+TABLE\s+sync_job_logs\b' apps/api/migrations && exit 1 || true
```

3 コマンドすべてで検出件数 **0 件** であることが AC-3 の検証条件である。

## AC-3 への対応

- `sync_log` を物理テーブルとして CREATE / RENAME / DROP しないことを禁止文言として grep ガード仕様に明記
- UT-09 受入条件への反映経路を本ドキュメントで確定
- 検証手段（grep コマンド例）を提示
- → AC-3（`sync_log` 物理化禁止の明記）満足

## 完了条件チェック

- [x] ファイル単位で「目的 / 変更種別 / 担当タスク / 本タスクのアクション」が表形式で網羅
- [x] `apps/api/migrations/0002_sync_logs_locks.sql` 改変禁止が成果物本文で再宣言
- [x] grep ガード（`CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME` 等が 0 件）が明示
- [x] grep コマンド例が記載
- [x] 本タスクのアクションが「検証 / 構造提案 / read-only 確認」に限定
