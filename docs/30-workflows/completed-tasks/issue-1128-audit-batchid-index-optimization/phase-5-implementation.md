# Phase 5: 実装（CONST_005 全項目）

> implementation_mode = `new`（current branch に既存実装なし＝RED/GREEN 新規実装）。
> NON_VISUAL / apps/api 専用。commit / PR / push / migration apply は **本 Phase の対象外**（user-gated・Phase 13）。

---

## 1. 変更対象ファイル一覧（パス + 種別）

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/migrations/0027_audit_log_batchid_index.sql` | **新規** | 相関列 + index 追加（方式B採用時は backfill UPDATE も含む）。rollback 手順をコメントで併記。 |
| `apps/api/src/repository/auditLog.ts` | **編集** | `listFiltered` の batchId 分岐（`:200-205`）を index 列走査へ切替。方式B採用時は `append`（`:103-138`）の INSERT に相関列を追加。 |
| `apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | **編集** | Phase 4 の TC-02 / TC-03 / TC-04（+方式B時 TC-05）を追記。既存 batchId 3 ケースは無改修保持。 |
| `apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts` | **新規** | TC-01（EXPLAIN QUERY PLAN）/ TC-01b（列・index 存在）。 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | 編集（必要時のみ） | route 契約非退化を確認。`GET /audit` の query surface・response shape が不変なら無改修で PASS する見込み。 |
| `apps/api/migrations/sequence-exceptions.json` | **不変** | `0027` は重複 prefix ではないため登録不要。 |

> 削除ファイルなし。

---

## 2. 実装手順ステップ

### Step 1: 方式決定 spike（Phase 2 実測の確定反映）

Miniflare D1 に方式A の DDL を流し、`EXPLAIN QUERY PLAN SELECT audit_id FROM audit_log WHERE batch_id='x';` を実行する。

- 結果が `USING INDEX idx_audit_log_batch_id` を示す → **方式A 採用**（VIRTUAL generated column）。
- DDL が拒否される／full scan（`SCAN audit_log`）になる → **方式B 採用**（plain `correlation_id` + backfill）。

決定を Phase 2 設計書および本 Phase 冒頭に追記する。以降の SQL / repository diff は採用方式のみを適用する（下記両版を提示）。

### Step 2: migration `0027` 作成（§3）。

### Step 3: repository 切替（§4）。

### Step 4: テスト緑化。Phase 4 の targeted run を実行し、新規 TC と既存非退化ケースを全 PASS にする。

---

## 3. migration `0027_audit_log_batchid_index.sql`（完全 SQL）

> `_setup.ts` は `--` 行内コメント除去 + `;` 分割で適用する（単文 DDL のみ可・`BEGIN...END` / トリガ不可）。両版とも単文 DDL + 単文 UPDATE で構成する。

### 方式A（第一候補・VIRTUAL generated column）

```sql
-- 0027_audit_log_batchid_index.sql
-- Issue #1128: audit_log の batchId 検索を index 走査に最適化する。
-- after_json / before_json の '$.batchId' を VIRTUAL generated column へ抽出し index を張る。
-- append-only 維持: 既存行への破壊的変更なし。generated column は読み取り専用。
-- 方式A: VIRTUAL（保存しない・読み取り時算出）。backfill 不要（既存行も自動で算出される）。

ALTER TABLE audit_log
  ADD COLUMN batch_id TEXT GENERATED ALWAYS AS (
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

CREATE INDEX IF NOT EXISTS idx_audit_log_batch_id
  ON audit_log(batch_id, created_at DESC, audit_id DESC)
  WHERE batch_id IS NOT NULL;

-- ROLLBACK（手動・参考。SQLite は DROP COLUMN を後置で実行する）:
--   DROP INDEX IF EXISTS idx_audit_log_batch_id;
--   ALTER TABLE audit_log DROP COLUMN batch_id;
-- 注: generated column は値を保存しないため、DROP しても既存データへの影響なし。
```

### 方式B（fallback・plain column + backfill）

```sql
-- 0027_audit_log_batchid_index.sql
-- Issue #1128: audit_log の batchId 検索を index 走査に最適化する（方式B fallback）。
-- VIRTUAL generated column が index されない D1 環境向け。plain 列 + backfill + index。
-- append-only 維持: backfill は migration 内 UPDATE のみ（アプリ API には UPDATE を足さない＝AC-7）。

ALTER TABLE audit_log ADD COLUMN correlation_id TEXT;

UPDATE audit_log
  SET correlation_id = COALESCE(
    CASE
      WHEN json_valid(after_json) THEN json_extract(after_json, '$.batchId')
      ELSE NULL
    END,
    CASE
      WHEN json_valid(before_json) THEN json_extract(before_json, '$.batchId')
      ELSE NULL
    END
  )
  WHERE correlation_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_correlation_id ON audit_log(correlation_id);

-- ROLLBACK（手動・参考）:
--   DROP INDEX IF EXISTS idx_audit_log_correlation_id;
--   ALTER TABLE audit_log DROP COLUMN correlation_id;
```

> rollback はファイルとして作らず、コメントとして migration に記録する（AC-6）。実行は user-gated。

---

## 4. `auditLog.ts` の before/after diff

### 4-1. `listFiltered` の batchId 分岐（`:200-205`）— 両方式 共通の切替

**Before（現行・`json_extract` full scan）:**

```ts
if (filters.batchId) {
  bindings.push(filters.batchId);
  where.push(
    `((json_valid(after_json) AND json_extract(after_json, '$.batchId') = ?${bindings.length}) OR (json_valid(before_json) AND json_extract(before_json, '$.batchId') = ?${bindings.length}))`,
  );
}
```

**After（index 列走査・既存 `add()` ヘルパ使用）:**

```ts
// 方式A:
if (filters.batchId) add("batch_id = ?", filters.batchId);

// 方式B:
if (filters.batchId) add("correlation_id = ?", filters.batchId);
```

> `add(sql, value)`（`:189-192`）は `bindings.push` + `?N` 置換 + `where.push` を行う既存ヘルパ。これに切り替えることで AND 結合・cursor 併用も既存と同一経路で担保される（非退化）。
> 戻り型は `Promise<AuditLogListRow[]>` のまま不変。`SELECT_COLS`（`:79-80`）は変更しない（相関列を返却列に足さない＝response shape 不変）。

### 4-2. `append` の INSERT 拡張（方式B採用時のみ・`:103-138`）

方式A採用時は **変更不要**（generated column のため write されない）。方式B採用時のみ以下を適用する。

**Before（抜粋）:**

```ts
const before = e.before ? JSON.stringify(e.before) : null;
const after = e.after ? JSON.stringify(e.after) : null;
await c.db
  .prepare(
    "INSERT INTO audit_log (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
  )
  .bind(
    auditId, e.actorId, e.actorEmail, e.action, e.targetType, e.targetId,
    before, after, createdAt,
  )
  .run();
```

**After（方式B・相関列 `?10` 追加）:**

```ts
const before = e.before ? JSON.stringify(e.before) : null;
const after = e.after ? JSON.stringify(e.after) : null;
const correlationId =
  (e.after?.batchId as string | undefined) ??
  (e.before?.batchId as string | undefined) ??
  null;
await c.db
  .prepare(
    "INSERT INTO audit_log (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at, correlation_id) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
  )
  .bind(
    auditId, e.actorId, e.actorEmail, e.action, e.targetType, e.targetId,
    before, after, createdAt, correlationId,
  )
  .run();
```

> `e.after` / `e.before` は `Record<string, unknown> | null`。`batchId` の型は `unknown` のため `as string | undefined` で取り出す（値が string でない場合の保険として `typeof ... === "string" ? ... : null` ガードを入れてもよい）。`append` の戻り型 `Promise<AuditLogEntry>` は不変（`correlation_id` を返却 entry に足さない）。

---

## 5. 入力・出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `listFiltered(c, filters)` | `AuditLogListFilters`（`batchId?` 含む・不変） | `AuditLogListRow[]`（不変） | 読み取りのみ。SQL の where 句が `batch_id = ?`（または `correlation_id = ?`）へ変わるが結果集合 contract は同一。 |
| `append(c, e)`（方式B時のみ変更） | `NewAuditLogEntry`（不変） | `AuditLogEntry`（不変） | INSERT 1 行に `correlation_id` 列が追加で書かれる。entry 戻り値は不変。 |
| migration `0027` | — | — | 列追加 + index 作成（方式B時さらに backfill UPDATE）。append-only 維持。 |

---

## 6. エラーハンドリング / エッジケース

| ケース | 挙動 |
| --- | --- |
| NULL batchId 行 | `batch_id`（`correlation_id`）が NULL になり `= ?` にマッチしない（誤ヒットしない＝TC-04）。 |
| 不正 JSON 行（`'{broken'`） | 方式A: `json_extract` が NULL を返し generated column も NULL。方式B: backfill UPDATE で `json_extract` が NULL を返し `correlation_id` NULL。いずれも誤ヒットせず（既存テスト `:152` の壊れ行で担保）。 |
| `after` と `before` 両方に batchId | COALESCE は `after` を優先。両者同値の通常運用では結果同一。 |
| `e.after.batchId` が string 以外（方式B write） | `as string \| undefined` で取り出すため非 string 値は不定。安全のため `typeof === "string"` ガード推奨。検索 contract には影響しない（実運用の batchId は string）。 |

---

## 7. ローカル検証コマンド

```bash
# 型チェック（filter 名は実 package.json で確認: name = "@ubm-hyogo/api"）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
# ※ ルート一括は `mise exec -- pnpm typecheck`（= pnpm -r typecheck）でも可

# D1 group targeted test（singleFork）
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts \
  apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts

# migration sequence guard
mise exec -- pnpm verify:d1-migrations   # = node scripts/verify-d1-migration-sequence.mjs

# lint（型ベース。apps/api の lint = tsc --noEmit）
mise exec -- pnpm lint
```

---

## 8. DoD（完了条件）

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` が緑。
- [ ] 対象 D1 vitest（repository / contract / migration spec）が全 PASS。
- [ ] TC-01 で `EXPLAIN QUERY PLAN` が `USING INDEX idx_audit_log_batch_id`（方式B: `idx_audit_log_correlation_id`）を示し `SCAN audit_log` を含まないことを確認。
- [ ] 既存 contract / repository batchId 3 ケース（`:122-235`）が無改修で非退化（PASS）。
- [ ] `mise exec -- pnpm verify:d1-migrations`（sequence guard）が緑。
- [ ] `auditLog.ts` から UPDATE/DELETE 関数を新規 export していない（append-only 維持＝AC-7）。`SELECT_COLS` 不変・`ListAuditQueryZ` 不変。
- [ ] 採用方式（A/B）と決定根拠（EXPLAIN QUERY PLAN 実測）を Phase 2 設計書と本 Phase 冒頭に記録した。
