# Phase 2 成果物 (2/2): D1 Migration 影響机上評価

> ステータス: spec_created / docs-only / NON_VISUAL
> 対応 AC: AC4
> 対象 migration（既存）: `apps/api/migrations/0002_sync_logs_locks.sql`
> 採用判断（軸 3）: `processed_offset INTEGER NOT NULL DEFAULT 0`（chunk index 単位）
> 物理 migration 発行は本タスク範囲外（→ UT-09 / U-UT01-07 へ申し送り）

本ファイルは `processed_offset` 列を `sync_job_logs` に追加する場合の影響を机上評価する。実 DDL 発行・apply・rollback は UT-09 / U-UT01-07 の責務であり、本タスクでは実施しない。

---

## 1. 既存 schema レビュー（`0002_sync_logs_locks.sql`）

| カラム | 型 | NULL | 既定 | 備考 |
| --- | --- | --- | --- | --- |
| id | INTEGER PK AUTOINCREMENT | NOT NULL | autoincrement | |
| run_id | TEXT UNIQUE | NOT NULL | - | UUID |
| trigger_type | TEXT | NOT NULL | - | cron / admin / backfill |
| status | TEXT | NOT NULL | - | running / success / failed / skipped |
| started_at | TEXT | NOT NULL | - | ISO8601 |
| finished_at | TEXT | NULL | - | |
| fetched_count | INTEGER | NOT NULL | 0 | |
| upserted_count | INTEGER | NOT NULL | 0 | |
| failed_count | INTEGER | NOT NULL | 0 | |
| retry_count | INTEGER | NOT NULL | 0 | |
| duration_ms | INTEGER | NULL | - | |
| error_reason | TEXT | NULL | - | |

`processed_offset` カラムは **不在**。

---

## 2. 追加 migration の DDL 案（参考のみ・本タスクでは発行しない）

```sql
-- migrations/0003_processed_offset.sql (UT-09 / U-UT01-07 で発行)
ALTER TABLE sync_job_logs ADD COLUMN processed_offset INTEGER NOT NULL DEFAULT 0;
-- index は付けない（status, started_at index で十分。クエリは run_id 直引き）
```

### DDL 設計判断

| 観点 | 判断 | 根拠 |
| --- | --- | --- |
| カラム名 | `processed_offset` | UT-01 sync-log-schema.md 論理名と一致 |
| 型 | INTEGER | chunk index は非負整数 |
| NULL 制約 | NOT NULL | 0 から始まる単調増加なので NULL の意味がない |
| DEFAULT | 0 | 既存行 backfill 不要（後段 §3 参照）|
| index | 不要 | `run_id` UNIQUE で個別ジョブ参照可能 |

---

## 3. backfill 戦略

### 既存行への影響

`0002` 適用済みの既存 `sync_job_logs` 行は worktree 内では prod / staging で運用前提だが、現状の運用状況に応じて以下 3 ケースを評価:

| ケース | 状態 | 必要処理 |
| --- | --- | --- |
| 1. status = `success` | 完了済。再開不要 | DEFAULT 0 で十分。再参照されない |
| 2. status = `failed` | 監査用 30 日保持。再開しない | DEFAULT 0 で意味矛盾なし。failed log の offset = 0 は「不明」を意味する |
| 3. status = `running` | stale lock 候補 | DEFAULT 0 で「進捗不明、行 0 から再取得」を意味し、現行 fallback 動作と整合する |

**結論**: backfill 不要。`DEFAULT 0` で全 case 整合する。

### 注意事項

- `failed` 状態の既存行は `processed_offset = 0` のまま残るが、**新規 migration 適用後の failed 行は実 chunk index を記録する**ため、ログ解析時には migration 日時で分岐する SQL ロジックが必要（`finished_at >= '2026-XX-XX'` 以降の行のみ意味を持つ）。これは Phase 6 失敗ケース整理で「過渡期 SQL noise」として扱う。

---

## 4. rollback 手順（参考のみ）

D1 は SQLite ベースで `ALTER TABLE DROP COLUMN` を 3.35 以降サポート。Cloudflare D1 の sqlite バージョン依存。

### 第 1 案: DROP COLUMN（D1 サポート時）

```sql
-- migrations/0003_processed_offset_rollback.sql
ALTER TABLE sync_job_logs DROP COLUMN processed_offset;
```

### 第 2 案: テーブル再構築（DROP COLUMN 非対応時）

```sql
BEGIN;
CREATE TABLE sync_job_logs_new (...0002 と同一定義...);
INSERT INTO sync_job_logs_new SELECT id, run_id, trigger_type, status, started_at, finished_at,
  fetched_count, upserted_count, failed_count, retry_count, duration_ms, error_reason FROM sync_job_logs;
DROP TABLE sync_job_logs;
ALTER TABLE sync_job_logs_new RENAME TO sync_job_logs;
CREATE INDEX idx_sync_job_logs_started ON sync_job_logs(started_at);
CREATE INDEX idx_sync_job_logs_status ON sync_job_logs(status, started_at);
COMMIT;
```

### rollback 判断基準

| シナリオ | rollback 要否 |
| --- | --- |
| `processed_offset` 列追加後、UT-09 実装側が再開ロジックを未実装 | 不要（DEFAULT 0 で従来動作と等価）|
| 列追加後、再開ロジックがバグで巻き戻し発生 | UT-09 側コード修正で対処、rollback は不要 |
| 列追加そのものに DDL 失敗 | migration tool レベルで対処（D1 migrations apply 失敗時の標準手順）|

**結論**: 列追加は backwards-compatible であり rollback の現実的必要性は低い。緊急対処はコード側で行う想定。

---

## 5. 影響範囲チェック（コード参照点）

`processed_offset` 追加によりコード側で更新を要するポイント:

| ファイル | 行（参考）| 変更内容 |
| --- | --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | `insertRunningLog` | INSERT に `processed_offset` 列追加（DEFAULT 0 でも明示推奨）|
| 同 | chunk loop（`for batch of chunk(...)` 内）| 各 chunk upsert 成功後に `UPDATE sync_job_logs SET processed_offset = ?2 WHERE run_id = ?1` |
| 同 | 再開ロジック（新規）| `failed → in_progress` 遷移時に `SELECT processed_offset FROM sync_job_logs WHERE run_id = ?` で取得し loop 開始 index を skip |
| `apps/api/src/jobs/__tests__/*` | - | 進捗テスト追加（→ Phase 4 テスト戦略）|

---

## 6. UT-09 / U-UT01-07 への申し送り

| 申し送り先 | 内容 |
| --- | --- |
| UT-09 | DDL 発行 + コード変更（chunk loop 内 UPDATE + 再開ロジック）+ 既存 test の verbose 化 |
| U-UT01-07 | `sync_log` 論理 ↔ `sync_job_logs` 物理マッピングに `processed_offset` を追加。本タスクで論理採用済 |
| U-UT01-08 | enum 整合タスクと無関係。直交を保つ |

---

## 7. AC4 充足

- [x] 追加列: `processed_offset INTEGER NOT NULL DEFAULT 0`
- [x] DEFAULT: 0
- [x] backfill: 不要（`DEFAULT 0` で全状態整合）
- [x] rollback: DROP COLUMN または再構築の 2 案
- [x] UT-09 / U-UT01-07 申し送り内容明記
- [x] 本タスクは机上評価のみ。物理 migration 発行なし

---

## 8. 完了条件チェック

- [x] DDL 案を提示（参考のみ）
- [x] backfill 戦略確定（不要）
- [x] rollback 手順 2 案
- [x] コード影響点列挙
- [x] 申し送り先明記
- [x] 物理 migration 発行・apply は本タスク外
