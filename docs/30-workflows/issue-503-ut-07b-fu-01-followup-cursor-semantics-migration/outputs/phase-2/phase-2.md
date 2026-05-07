# Phase 2: cursor 列 schema 設計 / migration 0015 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |
| 前提 | Phase 1 GO 判定済み |

## 目的

cursor 候補列の型・null 制約・初期値・既存 0014 dedupe / `failed_items_json` / `retry_count` 列との整合戦略を設計し、`apps/api/migrations/0015_schema_diff_queue_cursor.sql` の up/down SQL skeleton を確定する。各 row ではなく batch 単位で cursor を確定する方針を schema レベルで担保する。

## cursor 列の選定

### 候補比較

| 候補 | 型 | 利点 | 欠点 |
| --- | --- | --- | --- |
| A: `last_processed_id INTEGER` | INTEGER NULL | INTEGER PK で `WHERE id > ?` 検索が高速。比較演算が単純 | source row の PK が INTEGER 前提 |
| B: `last_processed_pk TEXT` | TEXT NULL | UUID / 複合キー対応可 | 文字列比較で INDEX 効率が劣る |

### 選定: 候補 A（`last_processed_id INTEGER`）

`schema_diff_queue` の row 単位処理は `id INTEGER PRIMARY KEY` を所与とする UT-07B-FU-01 既存実装に整合するため、候補 A を採用する。複合キーが必要になる将来拡張（例: 複数 schema 跨ぎ）は本タスクのスコープ外。

## 列定義

| 列名 | 型 | 制約 | 初期値 | 用途 |
| --- | --- | --- | --- | --- |
| `last_processed_id` | INTEGER | NULL 許容 | NULL | 直前 batch で処理した最大 id。次 batch は `WHERE id > last_processed_id` で取得 |

NULL 許容理由: cursor 経路 OFF（remaining-scan default）時はカラムが存在しても NULL のままで動作。cursor 経路 ON で初回は NULL → 初期 batch は `id > 0` 相当で開始する純関数を repository 側に置く。

## 既存列との整合戦略

| 既存列 | 整合方針 |
| --- | --- |
| `dedupe_key`（0014） | cursor 進行と独立。dedupe_key は依然 unique 制約として機能 |
| `failed_items_json`（0014） | failed item が残る batch では、その failed row より先に cursor を進めない。再処理不能な失敗は retry/DLQ 状態へ明示遷移してから cursor commit する |
| `retry_count`（0014） | cursor 進行と独立。row level の retry は維持 |
| `status`（既存） | `pending` / `running` / `done` の状態遷移は不変。cursor 進行と直交 |

### 重要な不変条件

- cursor を **batch 完了時に commit** する（row 単位の更新禁止）。これにより dedupe race を回避
- failed_items が残る場合、cursor は最後に安全に処理・記録された row id までしか進めない。未記録の失敗 row を skip する cursor commit は禁止
- cursor 列は `backfill.status` レスポンスに露出しない（Phase 1 の禁止スコープ準拠）

## migration `0015_schema_diff_queue_cursor.sql` skeleton

### up SQL

```sql
-- 0015_schema_diff_queue_cursor.sql
-- Cursor semantics: track last processed PK per schema_diff_queue row to avoid full re-scan per batch.
-- Internal-only column; not exposed via backfill.status API contract.
ALTER TABLE schema_diff_queue
  ADD COLUMN last_processed_id INTEGER;

-- Optional helper index for the next-batch lookup pattern: WHERE diff_id = ? AND id > last_processed_id ORDER BY id LIMIT ?
-- NOTE: SQLite では既存 PK INDEX が効くため、ここでは追加 INDEX を作らずに plan を Phase 11 で再評価する
-- （E4 evidence で SCAN になる場合のみ Phase 11 で本ファイルを再編集）
```

### down SQL

```sql
-- 0015_schema_diff_queue_cursor_down.sql
-- SQLite は ALTER TABLE DROP COLUMN を 3.35.0+ でのみサポートする。Cloudflare D1 は SQLite 互換のためサポート前提。
ALTER TABLE schema_diff_queue
  DROP COLUMN last_processed_id;
```

down SQL fallback（D1 の DROP COLUMN 不対応が判明した場合）:

```sql
-- fallback: column を残し、cursor 経路 OFF 時は NULL のまま放置する no-op rollback
-- 注: 不採用が確定した場合、本ファイル自体を作らない（migration 不発行）
```

## 不採用時の方針

Phase 11 evidence で「不採用」が確定した場合:

- `0015_schema_diff_queue_cursor.sql` を **作成しない**（migration 不発行）
- shadow flag / cursor 経路コードは Phase 12 で完全除去
- `outputs/phase-12/implementation-guide.md` に「remaining-scan 確定」を数値根拠付きで記録

## 採用判断保留時の方針

「判定保留」が出た場合、Phase 11 内で fixture サイズを変えて再測定する。本タスクを spec_blocked にせず、同一サイクル内で結論を出す。

## Acceptance Criteria

| ID | 内容 | 計測方法 |
| --- | --- | --- |
| AC-1 | cursor 列の型・制約・初期値が確定 | spec grep |
| AC-2 | 既存 0014 列との整合戦略が文書化 | spec grep |
| AC-3 | up/down SQL skeleton が記述 | spec grep |
| AC-4 | batch 単位 commit の不変条件が明記 | spec grep |
| AC-5 | 不採用時 / 保留時の方針が確定 | spec grep |

## 成果物

- `outputs/phase-2/phase-2.md`（本ファイル）

## 完了条件

- [ ] cursor 列定義 / migration skeleton / 整合戦略 / 不採用時方針 が確定
- [ ] Phase 3 着手の GO 判定（本ファイル + Phase 1 SSOT が両方揃った状態）
