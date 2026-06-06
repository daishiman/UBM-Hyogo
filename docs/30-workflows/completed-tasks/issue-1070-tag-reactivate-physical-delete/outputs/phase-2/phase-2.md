# Phase 2: 設計

現行コードを正本に、reactivate + physical delete の実装契約を確定する。後続 Phase 4-13 と実装サイクルはこの契約を SSOT とする。

## 2.1 Repository 層（`apps/api/src/repository/tagDefinitions.ts`・編集）

### 2.1.1 型追加

```ts
// physical delete の判別共用体（孤児化禁止のため has_references を明示）
export type PhysicalDeleteTagDefinitionResult =
  | { ok: true; row: TagDefinitionRow }                       // 参照0 → 削除成功（削除前 row を audit before 用に返す）
  | { ok: false; reason: "not_found" }                        // tag_id 不在
  | { ok: false; reason: "has_references"; referenceCount: number }; // member_tags 参照あり → 拒否
```

### 2.1.2 `reactivateTagDefinition`（新規・`deactivateTagDefinition` の対称形）

```ts
export async function reactivateTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<{ row: TagDefinitionRow; changed: boolean } | null> {
  const current = await getTagDefinitionByIdRaw(c, tagId);
  if (!current) return null;                       // not_found
  if (current.active) return { row: current, changed: false }; // 既に active → idempotent no-op
  const result = await c.db
    .prepare("UPDATE tag_definitions SET active = 1 WHERE tag_id = ?1 AND active = 0")
    .bind(tagId)
    .run();
  const row = await getTagDefinitionByIdRaw(c, tagId);
  if (!row) throw new Error("reactivated tag definition was not found");
  return { row, changed: (result.meta.changes ?? 0) > 0 };
}
```

- 入力: `tagId`。出力: `{ row, changed } | null`。副作用: `active=0→1` の UPDATE（active=0 の row のみ）。
- idempotency: 既に `active=1` の場合 UPDATE を発行せず `changed:false`。
- code conflict 不在: UNIQUE `code` 列に触れない。同一 row の `active` だけを戻す。

### 2.1.3 `countMemberTagReferences`（新規・physical delete ガード）

```ts
export async function countMemberTagReferences(c: DbCtx, tagId: string): Promise<number> {
  const r = await c.db
    .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE tag_id = ?1")
    .bind(tagId)
    .first<{ n: number }>();
  return r?.n ?? 0;
}
```

- DB-FK が無いため、参照整合はこの application-level count が唯一の防壁。

### 2.1.4 `physicalDeleteTagDefinition`（新規・ガード込み hard delete）

```ts
export async function physicalDeleteTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<PhysicalDeleteTagDefinitionResult> {
  const current = await getTagDefinitionByIdRaw(c, tagId);
  if (!current) return { ok: false, reason: "not_found" };
  const referenceCount = await countMemberTagReferences(c, tagId);
  if (referenceCount > 0) return { ok: false, reason: "has_references", referenceCount };
  await c.db.prepare("DELETE FROM tag_definitions WHERE tag_id = ?1").bind(tagId).run();
  return { ok: true, row: current }; // current = 削除前 snapshot（audit before 用）
}
```

- 参照ありは **削除前に拒否**（孤児 row を作らない）。参照0時のみ `DELETE FROM`。
- 削除後 `code` は解放（UNIQUE 制約から外れ再作成可能）。
- 不可逆: production 実行は user-gated（runbook）。

## 2.2 Route 層（`apps/api/src/routes/admin/tags.ts`・編集）

### 2.2.1 audit action union + ERROR_TO_STATUS 拡張

```ts
// appendTagAudit の action union に追加
action: "admin.tag.created" | "admin.tag.updated" | "admin.tag.deactivated"
       | "admin.tag.reactivated" | "admin.tag.physically_deleted";

// ERROR_TO_STATUS に追加
tag_has_references: 409,
```

- `AuditAction` は `RepoBrand<string>` のため brand 型変更不要。`AuditTargetType` も `"tag"` 既存。route の literal union のみ拡張。

### 2.2.2 `POST /tags/:tagId/reactivate`（新規）

```ts
app.post("/tags/:tagId/reactivate", async (c) => {
  const tagId = c.req.param("tagId");
  const result = await reactivateTagDefinition(db(c), tagId);
  if (!result) return fail(c, "tag_not_found");        // 404
  if (result.changed) {
    await appendTagAudit(c, {
      action: "admin.tag.reactivated",
      targetId: tagId,
      before: { active: false },
      after: { active: true },
    });
  }
  return c.json(rowBody(result.row), 200);             // idempotent でも 200 + 現 row
});
```

### 2.2.3 `DELETE /tags/:tagId/physical`（新規・既存 logical DELETE と分離）

```ts
app.delete("/tags/:tagId/physical", async (c) => {
  const tagId = c.req.param("tagId");
  const result = await physicalDeleteTagDefinition(db(c), tagId);
  if (!result.ok && result.reason === "not_found") return fail(c, "tag_not_found");   // 404
  if (!result.ok && result.reason === "has_references")
    return c.json({ ok: false, error: "tag_has_references", referenceCount: result.referenceCount }, 409);
  // ok: true
  await appendTagAudit(c, {
    action: "admin.tag.physically_deleted",
    targetId: tagId,
    before: {
      code: result.row.code, label: result.row.label,
      category: result.row.category, active: result.row.active,
    },
    after: null,
  });
  return c.body(null, 204);
});
```

- 既存 `app.delete("/tags/:tagId", ...)`（論理削除）は **不変**。Hono は `/tags/:tagId/physical` を別ルートとして解決する（prefix 衝突なし）。

## 2.3 endpoint contract サマリ

| Method | Path | 成功 | 異常 | audit |
|--------|------|------|------|-------|
| POST | `/admin/tags/:tagId/reactivate` | 200 row | 404 `tag_not_found` | `admin.tag.reactivated`（changed 時のみ） |
| DELETE | `/admin/tags/:tagId/physical` | 204 | 404 `tag_not_found` / 409 `tag_has_references`(+referenceCount) | `admin.tag.physically_deleted`（成功時のみ） |
| DELETE | `/admin/tags/:tagId`（既存・論理） | 204 | 404 | `admin.tag.deactivated`（変更時のみ） |

## 2.4 正本 spec 同期（`docs/00-getting-started-manual/specs/01-api-schema.md`・編集）

- tag master endpoints セクションに reactivate / physical delete を追記。
- 不変条件: physical delete は `member_tags` 参照ありなら 409 で拒否し孤児を作らない。logical(active=0 / code 占有継続) と physical(row 削除 / code 解放) の違いを明記。

## 2.5 migration

- **不要**。`member_tags` に FK を追加する選択肢もあるが、本サイクルでは application-level guard を正本とし schema 変更を行わない（既存 seed / ingest への影響回避）。

## 2.6 不変条件・データ整合

- arrange での既存 row 前提: `getTagDefinitionByIdRaw` は active 問わず取得（reactivate/physical 両方で前提確認に使用）。
- 参照整合: physical delete は参照0でのみ実行。member_tags は touch しない。
- audit append-only（既存）。reactivate no-op / physical 拒否時は audit 発火しない。
