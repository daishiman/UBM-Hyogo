# Phase 6: 実装手順

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (テスト計画) |
| 状態 | spec_created |

## 目的

T-01〜T-15 を実行可能な手順に展開する。後続実行者（または AI agent）がこの手順を順に実行すればコードが完成する粒度。

## 実装ステップ

### Step 1 (T-01, T-02): migration 0019 作成

1. `apps/api/migrations/0003_auth_support.sql` を読み、application audit table が `audit_log(after_json)` を持つことを確認
2. `apps/api/migrations/0019_schema_alias_soft_delete.sql` 新規作成

```sql
-- 0019_schema_alias_soft_delete.sql
-- Issue #778: schema alias rollback / undo 経路追加に伴う soft delete & 楽観ロック導入

ALTER TABLE schema_aliases ADD COLUMN deleted_at TEXT;
ALTER TABLE schema_aliases ADD COLUMN deleted_by TEXT;
ALTER TABLE schema_aliases ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

DROP INDEX IF EXISTS idx_schema_aliases_revision_stablekey_unique;
CREATE UNIQUE INDEX idx_schema_aliases_revision_stablekey_unique
  ON schema_aliases(revision_id, stable_key)
  WHERE deleted_at IS NULL
    AND stable_key IS NOT NULL
    AND stable_key != 'unknown'
    AND stable_key NOT LIKE '__extra__:%';

DROP INDEX IF EXISTS idx_schema_aliases_revision_question_unique;
CREATE UNIQUE INDEX idx_schema_aliases_revision_question_unique
  ON schema_aliases(revision_id, alias_question_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_schema_aliases_deleted_at
  ON schema_aliases(deleted_at);

-- audit relation は audit_log.after_json JSON 内の relatedAuditId に保存する。
-- audit_log の DDL は apps/api/migrations/0003_auth_support.sql のまま変更しない。
```

3. local 適用: `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --local`
4. 検証: `bash scripts/cf.sh d1 execute ubm-hyogo-db --local --command "PRAGMA table_info(schema_aliases);"`

### Step 2 (T-05): repository 拡張

`apps/api/src/repository/schemaAliases.ts`（無ければ新規）に以下を追加:
- `getById(db, id): Promise<SchemaAliasRow | null>` … `SELECT * FROM schema_aliases WHERE id = ? AND deleted_at IS NULL`
- `findActiveByStableKey(db, stableKey): ...` … 既存 select 全てに `AND deleted_at IS NULL`
- `buildSoftDeleteStatement(db, input)` … `UPDATE schema_aliases SET deleted_at = ?, deleted_by = ?, version = version + 1 WHERE id = ? AND version = ? AND deleted_at IS NULL`（更新行数 0 → version_mismatch / not_found）

### Step 3 (T-03): rollback workflow

`apps/api/src/workflows/schemaAliasRollback.ts` 新規作成。実装骨子:

```ts
export async function schemaAliasRollback(db, input) {
  const now = new Date().toISOString();
  const target = await getById(db, input.aliasId);
  if (!target) throw new SchemaAliasRollbackFailure("not_found", "...");
  if (target.deletedAt) throw new SchemaAliasRollbackFailure("already_deleted", "...");
  if (target.version !== input.expectedVersion)
    throw new SchemaAliasRollbackFailure("version_mismatch", "...");

  const auditId = crypto.randomUUID();
  const relatedAuditId = await findResolveAuditId(db, target.id);

  const softDelete = buildSoftDeleteStatement(db, {
    id: target.id,
    expectedVersion: input.expectedVersion,
    actor: input.actor,
    now,
  });
  const queueRestore = db.prepare(
    "UPDATE schema_diff_queue SET status = 'queued' WHERE question_id = ? AND status = 'resolved'",
  ).bind(target.aliasQuestionId);
  const auditInsert = db.prepare(
    "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?, ?, 'schema_alias.rollback', 'schema_alias', ?, ?, ?, ?)",
  ).bind(
    auditId,
    input.actor,
    target.id,
    JSON.stringify(target),
    JSON.stringify({ relatedAuditId, reason: input.reason, rolledBackAt: now }),
    now,
  );

  const results = await db.batch([softDelete, queueRestore, auditInsert]);
  if (results[0].meta.changes === 0)
    throw new SchemaAliasRollbackFailure("version_mismatch", "race detected");

  const impact = await computeImpact(db, target.stableKey);
  return { aliasId: target.id, rolledBackAt: now, relatedAuditId, newVersion: target.version + 1, impact };
}

async function computeImpact(db, stableKey) {
  const r = await db.prepare(
    "SELECT COUNT(*) as c FROM responses WHERE stable_key = ?",
  ).bind(stableKey).first();
  return { affectedResponseCount: Number(r?.c ?? 0), recomputeRequired: Number(r?.c ?? 0) > 0 };
}
```

### Step 4 (T-04): endpoint 追加

`apps/api/src/routes/admin/schema.ts` に追加:

```ts
admin.post("/admin/schema/aliases/:aliasId/rollback", requireAdmin, async (c) => {
  const aliasId = c.req.param("aliasId");
  const ifMatch = c.req.header("If-Match") ?? "";
  const m = /version=(\d+)/.exec(ifMatch);
  if (!m) return c.json({ error: "If-Match header required" }, 400);
  const expectedVersion = Number(m[1]);
  const body = await c.req.json().catch(() => ({}));
  const actor = c.get("adminEmail");
  try {
    const result = await schemaAliasRollback(c.env.DB, {
      aliasId, expectedVersion, actor, reason: body.reason,
    });
    return c.json(result, 200);
  } catch (e) {
    if (e instanceof SchemaAliasRollbackFailure) {
      const status = e.kind === "version_mismatch" ? 409
        : e.kind === "not_found" || e.kind === "already_deleted" ? 404
        : 500;
      return c.json({ error: e.kind, message: e.message }, status);
    }
    throw e;
  }
});
```

### Step 5 (T-06): 既存 query 更新 + grep gate

```bash
rg -n "FROM schema_aliases" apps/api/src --type ts
```

ヒットした全 query を `WHERE deleted_at IS NULL` を含む形に更新（既に WHERE 句があれば AND で追加）。完了後再 grep して未対応 0 件確認。

### Step 6 (T-07): web helper

`apps/web/src/lib/admin/api.ts` に追加:

```ts
export async function rollbackSchemaAlias(input: RollbackSchemaAliasInput) {
  const res = await fetch(`/api/admin/schema/aliases/${input.aliasId}/rollback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "If-Match": `version=${input.version}` },
    body: JSON.stringify({ reason: input.reason }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new RollbackApiError(res.status, body.error ?? "unknown");
  }
  return res.json();
}
```

### Step 7 (T-08): SchemaDiffPanel UI

- `<SchemaDiffPanel.HistoryPane>` 内部 component を追加（同ファイル内で実装、外部 export しない）
- resolved alias 一覧表示 + 各行 rollback ボタン
- 確認 modal（OKLch token: `bg-surface` / `text-foreground` 等）
  - 影響件数表示
  - actor email 再表示
  - 再集計要否 warning（`text-warning-foreground`）
- undo toast: resolve 完了後 5 分間表示。`setTimeout(() => setUndoState({kind:"hidden"}), 5 * 60 * 1000)`
- mutation は `useAdminMutation` 経由（CLAUDE.md #10）

### Step 8 (T-13): 分離 followup の unassigned-task 作成

`docs/30-workflows/unassigned-task/` 配下に followup-{005,006,007} の 3 ファイルを新規作成する。followup-003 は既存 `serial-05-step-03-followup-003-schema-diff-history-view.md` を参照し、重複ファイルは作らない。テンプレートは既存 `serial-05-step-03-followup-004-...md` を踏襲。

### Step 9 (T-14): 原典 fold-state sync

`docs/30-workflows/unassigned-task/serial-05-step-03-followup-004-schema-alias-rollback-undo.md` の状態語彙セクションに `consumed_via_issue_778_rollback_undo_spec` を追記。

## 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test
mise exec -- pnpm --filter @ubm/web test
rg -n "FROM schema_aliases" apps/api/src --type ts | rg -v "deleted_at"  # 0 件期待
rg -n "bg-\[#|text-\[#" apps/web/src/components/admin/SchemaDiffPanel.tsx  # 0 件期待
```

## 完了条件

- [ ] Step 1-9 すべて実行済
- [ ] 全検証コマンドが 0 件 / pass
- [ ] DoD（Phase 5）満たす

## 次 Phase

- 次: 7（テスト計画）
