# Phase 2: 設計

## 真の論点（要件レビュー一次結論）

| 観点 | 結論 |
| --- | --- |
| 価値性 | audit 行増大時の batchId 検索コストを full scan → index 走査へ下げる（管理者の bulk 操作相関閲覧レイテンシ） |
| 実現性 | migration 1 本 + repository 1 ファイル + test で 1 サイクル完了。テストハーネスが Miniflare D1（D1 同一エンジン）で実測検証可能 |
| 整合性 | append-only 不変条件・query surface 不変・D1 apps/api 閉域と矛盾しない |
| 運用性 | rollback 手順を migration に併記。EXPLAIN QUERY PLAN で index 走査を恒久検証 |
| 4条件 | 全条件クリア。唯一の不確実性 = 「VIRTUAL generated column の index を D1 が許すか」→ 本 Phase で実測決定 |

## 主問題

batchId が `after_json` / `before_json` の JSON payload 内に非対称に埋め込まれているため index が貼れず、`json_extract` 検索が full scan になる。**1 列に COALESCE で畳み込んで index 化する**のが解。

## 列方式の決定（実測ゲート）

元 Issue は「STORED generated column 第一候補」だったが、SQLite 制約により方式を再評価する。

### 方式比較

| 方式 | ADD COLUMN 可否 | index 可否 | append() 変更 | backfill | D1 不確実性 |
| --- | --- | --- | --- | --- | --- |
| **A: VIRTUAL generated column**（第一候補） | ✅ 可（SQLite は VIRTUAL のみ ADD COLUMN 許可） | ✅ index は算出値を materialize | 不要（派生列） | 不要（index 構築で全行算出） | VIRTUAL 列の index 対応を実測要 |
| **B: plain `correlation_id` 列**（fallback） | ✅ 可 | ✅ 通常列 index | **要**（write 時に batchId 抽出格納） | **要**（UPDATE migration） | なし（最も確実） |
| C: STORED generated column | ❌ ALTER ADD 不可（テーブル再構築必要） | ✅ | 不要 | 不要 | append-only 大テーブル再構築は高リスク → 不採用 |

> C を不採用とするのが本タスクの「issue 鮮度補正」の核心。SQLite の `ALTER TABLE ADD COLUMN` は STORED generated column を拒否する（既存行再計算が必要なため）。

### 実測検証手順（Phase 2 で実施 / Phase 5 実装前に確定）

Miniflare D1（`_setup.ts` と同一エンジン）に対し、方式 A の DDL を流して index 走査が効くか確認する。検証用使い捨てスクリプト or 一時 spec で:

```sql
ALTER TABLE audit_log ADD COLUMN batch_id TEXT
  GENERATED ALWAYS AS (
    COALESCE(
      CASE WHEN json_valid(after_json) THEN json_extract(after_json,'$.batchId') END,
      CASE WHEN json_valid(before_json) THEN json_extract(before_json,'$.batchId') END
    )
  ) VIRTUAL;
CREATE INDEX idx_audit_log_batch_id
  ON audit_log(batch_id, created_at DESC, audit_id DESC)
  WHERE batch_id IS NOT NULL;
EXPLAIN QUERY PLAN
  SELECT audit_id FROM audit_log WHERE batch_id = 'batch-1079';
```

**判定基準**:
- `EXPLAIN QUERY PLAN` 出力に `USING INDEX idx_audit_log_batch_id`（または `SEARCH audit_log USING INDEX ...`）が現れ、`SCAN audit_log` でなければ → **方式 A 採用**。
- VIRTUAL 列への index が拒否される / full scan のまま → **方式 B（plain `correlation_id`）へ fallback**。

> 期待: SQLite は VIRTUAL generated column の index を公式サポートするため方式 A が通る見込み。万一の D1 差異に備え B を用意する。

## 設計（方式 A: VIRTUAL generated column）

### migration `0027_audit_log_batchid_index.sql`

```sql
-- 0027_audit_log_batchid_index.sql
-- Issue #1128 (#1079 follow-up B-1): audit_log batchId 検索を json_extract full scan から
-- index 列走査へ最適化。batchId は after_json(assign)/before_json(unassign) に非対称に埋まるため
-- COALESCE で 1 列へ畳み込む VIRTUAL generated column を追加し index 化する。
-- 関連: docs/30-workflows/completed-tasks/issue-1128-audit-batchid-index-optimization/

-- 1. batchId 相関列（VIRTUAL = ADD COLUMN 可・既存行へ自動波及・write path 変更不要）
ALTER TABLE audit_log ADD COLUMN batch_id TEXT
  GENERATED ALWAYS AS (
    COALESCE(
      CASE
        WHEN json_valid(after_json) THEN json_extract(after_json, '$.batchId')
        ELSE NULL
      END,
      CASE
        WHEN json_valid(before_json) THEN json_extract(before_json, '$.batchId')
        ELSE NULL
      END
    )
  ) VIRTUAL;

-- 2. index（NULL 行はまばら＝sparse。index 構築で既存行も自動的に検索対象になる）
CREATE INDEX IF NOT EXISTS idx_audit_log_batch_id
  ON audit_log(batch_id, created_at DESC, audit_id DESC)
  WHERE batch_id IS NOT NULL;

-- rollback:
--   DROP INDEX IF EXISTS idx_audit_log_batch_id;
--   ALTER TABLE audit_log DROP COLUMN batch_id;
```

### repository 変更（`auditLog.ts:200-205`）

```ts
// before（full scan）
if (filters.batchId) {
  bindings.push(filters.batchId);
  where.push(
    `((json_valid(after_json) AND json_extract(after_json, '$.batchId') = ?${bindings.length}) OR (json_valid(before_json) AND json_extract(before_json, '$.batchId') = ?${bindings.length}))`,
  );
}

// after（index 列走査）
if (filters.batchId) {
  add("batch_id = ?", filters.batchId);   // 既存 add() ヘルパで bindings 連番化
}
```

> 方式 A では `append` / `SELECT_COLS` は変更不要（`batch_id` は派生列・SELECT には含めない）。

## 設計（方式 B: plain `correlation_id` — fallback）

### migration `0027_audit_log_batchid_index.sql`

```sql
-- 1. 相関列（plain）
ALTER TABLE audit_log ADD COLUMN correlation_id TEXT;

-- 2. 既存行 backfill（AC-4）
UPDATE audit_log
   SET correlation_id = COALESCE(json_extract(after_json,'$.batchId'), json_extract(before_json,'$.batchId'))
 WHERE correlation_id IS NULL;

-- 3. index
CREATE INDEX IF NOT EXISTS idx_audit_log_correlation_id ON audit_log(correlation_id);

-- rollback:
--   DROP INDEX IF EXISTS idx_audit_log_correlation_id;
--   ALTER TABLE audit_log DROP COLUMN correlation_id;
```

### repository 変更（方式 B では `append` も拡張）

- `append`（`:103-138`）: INSERT に `correlation_id` を追加し、`e.after?.batchId ?? e.before?.batchId ?? null` を格納（write path で常に最新化）。INSERT 列・`VALUES` 連番・`.bind` 引数を 1 つ増やす。
- `listFiltered`: `add("correlation_id = ?", filters.batchId)`。

> 方式 B は append() の write path 変更が増えるが D1 不確実性がゼロ。方式 A が実測で通れば B は採用しない。

## ステップ間 / 状態所有権

| 要素 | 所有者 | 備考 |
| --- | --- | --- |
| batchId → 相関列の算出 | 方式 A = DB（generated）/ 方式 B = `append`（write 時） | 読み取りはどちらも `listFiltered` の `WHERE 相関列 = ?` |
| index | D1 schema（migration） | EXPLAIN QUERY PLAN で恒久検証 |
| append-only 保証 | `auditLog.ts`（UPDATE/DELETE 非 export） | backfill は migration 内 SQL のみ（AC-7） |

## rollback / 運用

- migration ファイル末尾に rollback SQL をコメントで併記（AC-6）。
- production / staging apply は `bash scripts/cf.sh d1 migrations apply ... --env <env>`（user-gated）。
- `pnpm verify:d1-migrations` と `node --test scripts/__tests__/verify-d1-migration-sequence.test.mjs` で sequence guard を通す。

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| VIRTUAL 列の index を D1 が拒否 | 中 | Phase 2 実測で判定 → 方式 B へ fallback |
| backfill 漏れ（方式 B） | 低 | `WHERE correlation_id IS NULL` の UPDATE を AC-4 必須化。方式 A は不要 |
| `_setup.ts` の `;` 分割が DDL を壊す | 低 | 単文 DDL のみ・`BEGIN..END` 不使用で回避 |
| 親 #1036 の「軽量 batchId 方針（schema 変更なし）」と矛盾 | 中 | 本タスクは「full scan コスト顕在化時のトリガ付き別関心」。Issue は YAGNI 先送り済みで、ユーザー指示により今サイクルで根本解決する旨を index.md に明記 |
