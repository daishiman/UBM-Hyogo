# D1 schema migration 設計 — 0020_schema_alias_recompute_jobs

## 採番根拠

`apps/api/migrations/` の最新は `0019_schema_alias_soft_delete.sql`（Issue #778）。次番号は `0020`。

> 注: `0008` / `0014` / `0015` は重複番号が既存（`0008_create_schema_aliases.sql` と `0008_schema_alias_hardening.sql` 等）。本タスクは単一ファイル `0020_schema_alias_recompute_jobs.sql` で衝突なし。

## DDL（apps/api/migrations/0020_schema_alias_recompute_jobs.sql）

```sql
-- Issue #836: schema alias rollback 後の再集計（recompute）job 追跡テーブル。
-- recompute = response_fields の reverse-backfill（alias.stable_key -> __extra__:{question_id}）。
-- idempotency: (alias_id, stable_key, trigger_key) UNIQUE。同一 trigger の再実行を吸収する。
CREATE TABLE IF NOT EXISTS schema_alias_recompute_jobs (
  job_id          TEXT PRIMARY KEY,
  alias_id        TEXT NOT NULL,
  stable_key      TEXT NOT NULL,
  question_id     TEXT NOT NULL,
  trigger_key     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
  affected_count  INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  updated_count   INTEGER NOT NULL DEFAULT 0,
  deleted_collision_count INTEGER NOT NULL DEFAULT 0,
  cursor          TEXT,
  recompute_audit_id TEXT,
  locked_at       TEXT,
  locked_by       TEXT,
  run_token       TEXT,
  last_error      TEXT,
  created_by      TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- idempotency 制約: 同一 alias × stable_key × trigger_key は 1 job のみ
CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_alias_recompute_jobs_trigger_unique
  ON schema_alias_recompute_jobs (alias_id, stable_key, trigger_key);

-- alias 単位の直近 job 取得用
CREATE INDEX IF NOT EXISTS idx_schema_alias_recompute_jobs_alias
  ON schema_alias_recompute_jobs (alias_id, created_at);
```

## カラム定義

| カラム | 型 | 説明 |
| --- | --- | --- |
| job_id | TEXT PK | `crypto.randomUUID()` 由来 |
| alias_id | TEXT | 対象 schema_aliases.id（soft-deleted を含む） |
| stable_key | TEXT | recompute 対象の旧 stable_key（= alias.stable_key） |
| question_id | TEXT | alias.alias_question_id。reverse 先 `__extra__:{question_id}` の構成に使う |
| trigger_key | TEXT | idempotency キー。既定は元 rollback の audit_id（不在時 `alias_id:version`）。同一 trigger の再実行を吸収 |
| status | TEXT | `pending`（作成直後）→ `running`（処理中・CPU budget 継続）→ `completed` / `failed` |
| affected_count | INTEGER | recompute 対象として検出した response_fields 行数（最終確定値） |
| processed_count | INTEGER | 実際に reverse-backfill した行数（idempotent 再実行で増分なし） |
| updated_count | INTEGER | stableKey → `__extra__` へ UPDATE した行数 |
| deleted_collision_count | INTEGER | `__extra__` 既存衝突により stableKey 行を DELETE した行数 |
| cursor | TEXT | CPU budget exhausted 時の継続位置（last processed `response_id`。NULL = 完了 or 未開始） |
| recompute_audit_id | TEXT | 初回 `schema_alias.recompute` audit row id。completed 冪等返却時に同じ id を返す |
| locked_at / locked_by / run_token | TEXT | conditional claim lease。並行 POST が同じ running job を同時処理しないための guard |
| last_error | TEXT | 失敗時のエラーメッセージ。成功で NULL |
| created_by | TEXT | admin actor email |
| created_at / updated_at | TEXT | ISO8601 |

## status 遷移

```
pending ──(reverse-backfill 開始)──► running ──(全件処理完了)──► completed
                                        │
                                        ├─(CPU budget exhausted)─► running（cursor 保存・再呼び出しで継続）
                                        └─(例外)──────────────────► failed（last_error 記録）
```

## idempotency 設計

- `createOrGetJob()` は `(alias_id, stable_key, trigger_key)` で既存 job を検索する。
  - 既存が `completed`: そのまま返す（reverse-backfill を再実行しない → 二重変動なし）。
  - 既存が `running`: lease 未期限切れなら current status を返す。lease 期限切れなら conditional update で claim し、cursor から継続する。
  - 既存が `failed`: 同一 job を再利用し `running` へ遷移して再試行する。
  - 不在: 新規 INSERT（`pending`）。
- reverse-backfill 自体も `__extra__:{question_id}` へ向けた UPDATE で、対象が既に reverse 済みなら 0 件 UPDATE になり idempotent。
- `claimJob()` は `WHERE run_token IS NULL OR locked_at < leaseExpiry` を含む conditional update とし、同一 job の並行 runner を防ぐ。

## 既存テーブルとの関係（変更なし）

- `response_fields`（`0001_init.sql:75-81`）: PK `(response_id, stable_key)`。recompute は `stable_key` を UPDATE する（DELETE → UPDATE 衝突回避は backfill と対称）。**DDL 変更なし**。
- `schema_aliases`（`0019` で `deleted_at` / `version` 追加済み）: recompute は soft-deleted alias を `includeDeleted: true` で参照。**DDL 変更なし**。
- `audit_log`（`0003_auth_support.sql`）: `schema_alias.recompute` action を INSERT。**DDL 変更なし**。

## ロールバック / 前方互換

- `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` で再適用安全。
- down migration は D1 migrations の慣習に従い別途用意しない（既存 migration も forward-only）。

## 検証（Phase 11 RAC-1）

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --env staging   # user-gated
# PRAGMA table_info(schema_alias_recompute_jobs) でカラム確認
# PRAGMA index_list(schema_alias_recompute_jobs) で unique index 確認
```
