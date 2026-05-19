# Pattern: D1 Soft Delete + Optimistic Lock + db.batch Atomic Mutation（汎用テンプレート）

Cloudflare D1 で「論理削除（soft delete）」「楽観ロック（optimistic lock）」「複数 SQL の atomic mutation（`db.batch()`）」を組み合わせ、rollback / undo / 取り消し系 admin endpoint を実装するための汎用パターン。本テンプレートは特定 issue に依存しない正本仕様であり、`issue-778-schema-alias-rollback-undo` を初出参考実装とする。

---

## メタ情報

| 項目 | 値 |
| --- | --- |
| パターン ID | `PATTERN-D1-SOFT-DEL-OPTLOCK-BATCH` |
| 初出 | Issue #778 (`docs/30-workflows/issue-778-schema-alias-rollback-undo/`) |
| 適用層 | `apps/api` （`apps/web` から D1 直接アクセスは引き続き禁止） |
| Anchors | Specification-Driven Development / DDD Aggregate Boundary / Progressive Disclosure |

---

## 適用シーン

以下のいずれかを満たす admin mutation に適用する。

- 物理削除では履歴・関係 audit が追跡不能になる（例: `schema_aliases` の alias 行）
- 同一行への並行 mutation が起こりうる（複数 admin operator の楽観衝突）
- 元 mutation の audit row と rollback の audit row を application 層で relate する必要がある
- 1 transaction 相当で `UPDATE soft-delete + INSERT queue / restore + INSERT audit_log` を atomic にしたい

---

## パターン構成

### 1. D1 schema 拡張（migration）

対象テーブルに以下 3 列を追加する。既存 unique index は partial unique index に置換する。

```sql
ALTER TABLE <table> ADD COLUMN deleted_at TEXT;
ALTER TABLE <table> ADD COLUMN deleted_by TEXT;
ALTER TABLE <table> ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- 既存 unique を partial に置換（active 行のみ unique 制約）
DROP INDEX IF EXISTS <existing_unique>;
CREATE UNIQUE INDEX <existing_unique>
  ON <table>(<cols>)
  WHERE deleted_at IS NULL;

-- 検索性能向上（soft-deleted 行の cold path 抑制）
CREATE INDEX idx_<table>_deleted_at ON <table>(deleted_at);
```

migration 番号は monorepo 内連番（issue-778 は `apps/api/migrations/0019_schema_alias_soft_delete.sql`）。

### 2. API contract

```
POST /admin/<resource>/:id/rollback
Headers:
  If-Match: version=<N>      # 楽観ロック必須。N は client が直前 GET で取得した値
Body:
  { "reason"?: string }      # optional. audit_log.after_json に保存
Response 200:
  {
    "<resourceId>": string,
    "rolledBackAt": string (ISO 8601),
    "relatedAuditId": string,   // 元 mutation の audit_log.id
    "newVersion": number,       // optimistic lock 更新後の version
    "impact": { ... }           // resource 固有 (e.g. affectedResponseCount)
  }
Errors:
  400 bad_request          # body 形式 / If-Match パース失敗
  404 not_found            # row 不在
  404 already_deleted      # deleted_at IS NOT NULL
  409 version_mismatch     # If-Match version != current
  500 internal_error
```

### 3. Workflow / repository 実装

mutation は workflow module（例: `apps/api/src/workflows/<resource>Rollback.ts`）に閉じ、route handler は薄く保つ。3 文の atomic mutation:

```ts
await db.batch([
  // (a) soft delete + version bump（条件付き UPDATE）
  db.prepare(
    `UPDATE <table>
       SET deleted_at = ?, deleted_by = ?, version = version + 1
     WHERE id = ?
       AND deleted_at IS NULL
       AND version = ?`,
  ).bind(now, actor, id, expectedVersion),

  // (b) downstream restore / queue insert（必要に応じて）
  db.prepare(`INSERT INTO <queue or restore table> ...`).bind(...),

  // (c) audit_log insert（after_json.relatedAuditId で元 audit を参照）
  db.prepare(
    `INSERT INTO audit_log (id, action, target_type, target_id, actor, after_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(auditId, '<resource>.rollback', '<target_type>', id, actor, JSON.stringify({
    reason,
    relatedAuditId,
  }), now),
]);
```

`db.batch()` は Cloudflare D1 公式仕様で **all-or-nothing transaction**（Cloudflare Workers Docs: <https://developers.cloudflare.com/d1/worker-api/d1-database/#batch>）。`meta.changes === 0` で (a) の `WHERE version = ?` が外れた場合は `409 version_mismatch` を返す。

### 4. Audit relation

- 元 mutation の audit row id を repository から取得し、rollback row の `after_json.relatedAuditId` に application 層で書き込む。
- **`cf_audit_log`（Cloudflare ingestion 側 read-only）と `audit_log`（application admin mutation 側）の混同禁止**。relation は application `audit_log` のみで完結させる。

### 5. UI 側（apps/web）

- list view に "Rollback" / "取り消し" action を追加。click で confirm modal（影響行数・affected response count を表示）。
- 成功後は 5 分間の Undo toast を表示し、operator が即座に rollback 実行を取り消すか、または expire まで待つ。Undo は別 endpoint ではなく rollback 自身の冪等再実行 + UI optimistic update で表現する。
- mutation は `@/features/admin/hooks/useAdminMutation` 経由（CLAUDE.md 不変条件 10）。

---

## 苦戦箇所と対策

| ID | 苦戦箇所 | 対策 |
| --- | --- | --- |
| C-1 | `If-Match: version=N` の parse + 409 境界 | header 形式は `version=<int>` 固定。regex `^version=(\d+)$` で parse 失敗は 400、parse 成功で `meta.changes=0` の場合のみ 409。route handler の責務として contract spec に固定 |
| C-2 | `db.batch()` atomicity 仕様引用の不確実性 | Phase 02 design で Cloudflare Workers Docs URL を直接引用し、Phase 07 で fault-injection spec（最後の prepare を意図的に fail させ前段の UPDATE が rollback されることを確認）を必須化 |
| C-3 | soft delete 一貫性（既存 SELECT が deleted 行を拾う） | repository 内 `FROM <table>` 全箇所に `AND deleted_at IS NULL` を追加。grep gate (§ grep gate) で physical enforcement |
| C-4 | `cf_audit_log` と application `audit_log` の混同 | issue-778 仕様 §Audit relation に明示的な責務分離。`cf_audit_log` はリードオンリーの ingestion 層、relation は `audit_log.after_json.relatedAuditId` に限定 |
| C-5 | scope 肥大化（bulk rollback / notification / recompute trigger を同時導入したくなる） | followup タスクを `unassigned-task/` に分離（issue-778 では followup-005/006/007）。本タスクの `index.md` 冒頭で CONST_007 例外宣言（除外スコープの明示）必須 |

---

## grep gate

実装後の不変条件を grep で機械的に検証する（CI または pre-push hook 推奨）。

| Gate | コマンド | 期待値 |
| --- | --- | --- |
| G-soft-del-1 | `rg "FROM <table>" apps/api/src \| rg -v "deleted_at IS NULL"` | 0 行（active filter 抜けが無いこと） |
| G-soft-del-2 | `rg "UPDATE <table>" apps/api/src \| rg -v "version ="` | 0 行（version bump 抜けが無いこと） |
| G-audit-rel | `rg "cf_audit_log" apps/api/src/workflows/` | 0 行（application mutation で cf 側を書かない） |
| G-batch | `rg "db\.batch\(\[" apps/api/src/workflows/<resource>Rollback.ts` | 1 行以上（直接 `db.prepare(...).run()` の連続記述を防ぐ） |

---

## 参考実装（Issue #778）

| 関心 | 実体 |
| --- | --- |
| migration | `apps/api/migrations/0019_schema_alias_soft_delete.sql` |
| repository | `apps/api/src/repository/schemaAliases.ts` |
| workflow | `apps/api/src/workflows/schemaAliasRollback.ts` |
| route | `apps/api/src/routes/admin/schema.ts`（`POST /admin/schema/aliases/:aliasId/rollback`） |
| route test | `apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts` |
| UI | `apps/web/src/components/admin/SchemaDiffPanel.tsx`（HistoryPane + RollbackConfirmModal + 5 分 UndoToast） |
| UI test | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` |
| API client | `apps/web/src/lib/admin/api.ts` |
| spec | `docs/00-getting-started-manual/specs/01-api-schema.md`, `docs/00-getting-started-manual/specs/11-admin-management.md` |
| workflow root | `docs/30-workflows/issue-778-schema-alias-rollback-undo/` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-778-schema-alias-rollback-undo-artifact-inventory.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-d1-batch-atomicity-and-soft-delete-2026-05.md`（L-DBATCH / L-SOFTDEL / L-OPTLOCK / L-AUDITREL / L-SCOPE） |

---

## 関連パターン

- `gate-c-external-mutation-pattern.md` — 不可逆 mutation 一般の Gate C ゲートパターン（D1 mutation は内部 mutation のため対象外。Cloudflare 外部 SaaS state 変更時のみ Gate C を併用）
- `database-schema-07b-schema-alias-assignment.md` — `schema_aliases` の primary schema 正本
