# Phase 5: 実装（TDD GREEN）

> Phase 4 の RED テストを全件 PASS させる。実装区分 NON_VISUAL。
> SQL・関数シグネチャは [Phase 2](../phase-2/phase-2.md) をコントラクトとして写像する。
> route → repository 直結（use-case 層なし。既存 admin tag route 慣例）。
> 「canUseTool 適用範囲」等 SDK 項目は該当なし。
> 既存 `tagDefinitions.ts` / `tags.ts`（issue-1035 で landed）への **追記**であり、既存 surface は不変。

## 0. 新規作成 / 修正ファイル一覧

| # | パス | 種別 | 概要 |
|---|------|------|------|
| 1 | `apps/api/src/repository/tagDefinitions.ts` | 編集 | 型 `PhysicalDeleteTagDefinitionResult` + 関数 3（`reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition`） |
| 2 | `apps/api/src/routes/admin/tags.ts` | 編集 | audit action union 拡張 + `ERROR_TO_STATUS.tag_has_references:409` + route 2（`POST /tags/:tagId/reactivate` / `DELETE /tags/:tagId/physical`） |
| 3 | `docs/00-getting-started-manual/specs/01-api-schema.md` | 編集 | tag master endpoints に reactivate / physical delete + 参照ガード不変条件を追記（Phase 12 Step 2 で最終整合・本 Phase はコード優先） |

> **新規 migration なし**（Phase 2 §2.5）。`apps/web` 非接触。`auditLog.ts` の `AuditTargetType` は既に `"tag"` を含むため **型変更不要**。`AuditAction` は `RepoBrand<string>` のため brand 型変更不要。

---

## 1. `apps/api/src/repository/tagDefinitions.ts`（編集）

### 1.1 追加する型（既存 `CreateTagDefinitionResult` の近傍）

```ts
// issue-1070: physical delete の判別共用体。
//   member_tags への DB-FK が無いため、参照ガードはこの application-level count が唯一の防壁。
export type PhysicalDeleteTagDefinitionResult =
  | { ok: true; row: TagDefinitionRow }                                 // 参照0 → 削除成功（削除前 row を audit before 用に返す）
  | { ok: false; reason: "not_found" }                                  // tag_id 不在
  | { ok: false; reason: "has_references"; referenceCount: number };    // member_tags 参照あり → 拒否
```

### 1.2 `reactivateTagDefinition`（新規・`deactivateTagDefinition` の対称形）

既存 `deactivateTagDefinition` の直後に追加する。`getTagDefinitionByIdRaw` / `SELECT_COLS` / `map` は既存定義を再利用。

```ts
/**
 * tag master を再有効化する（active=0→1）。member_tags は触らない。
 * 戻り値: 対象不在=null / 既に active=1=既存 row（changed:false, idempotent no-op）/
 *         active=0→1=更新後 row（changed:true）。
 * code conflict 構造的不在: UNIQUE code 列には触れず、同一 row の active のみ戻すため
 * spurious 409 path を作らない（deactivate の鏡像）。
 */
export async function reactivateTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<{ row: TagDefinitionRow; changed: boolean } | null> {
  const current = await getTagDefinitionByIdRaw(c, tagId);
  if (!current) return null;
  if (current.active) return { row: current, changed: false }; // 既に active → no-op
  const result = await c.db
    .prepare("UPDATE tag_definitions SET active = 1 WHERE tag_id = ?1 AND active = 0")
    .bind(tagId)
    .run();
  const row = await getTagDefinitionByIdRaw(c, tagId);
  if (!row) throw new Error("reactivated tag definition was not found");
  return { row, changed: (result.meta.changes ?? 0) > 0 };
}
```

- 入力: `tagId`。出力: `{ row, changed } | null`。副作用: `active=0` の row のみ `active=1` へ UPDATE。
- idempotency: 既に `active=1` の場合 UPDATE を発行せず `changed:false`。
- エラー: UPDATE 直後の再取得が null になるのは理論上 race のみ → `throw`（握り潰さない）。

### 1.3 `countMemberTagReferences`（新規・physical delete ガード）

```ts
/**
 * 指定 tag を参照する member_tags 行数を返す。physical delete の参照ガード用。
 * member_tags に tag_definitions への DB-FK が無いため、この count が孤児化防止の唯一の防壁。
 */
export async function countMemberTagReferences(c: DbCtx, tagId: string): Promise<number> {
  const r = await c.db
    .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE tag_id = ?1")
    .bind(tagId)
    .first<{ n: number }>();
  return r?.n ?? 0;
}
```

### 1.4 `physicalDeleteTagDefinition`（新規・ガード込み hard delete）

```ts
/**
 * tag master を物理削除する（DELETE FROM tag_definitions）。
 * 参照ありは削除前に has_references で拒否し孤児 row を作らない。参照0時のみ DELETE。
 * 削除成功時は削除前 snapshot（audit before 用）を row として返す。
 * 削除後 code は UNIQUE 制約から解放され、同 code の再作成が可能になる。
 * 不可逆: production 実行は user-gated（runbook）。
 */
export async function physicalDeleteTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<PhysicalDeleteTagDefinitionResult> {
  const current = await getTagDefinitionByIdRaw(c, tagId);
  if (!current) return { ok: false, reason: "not_found" };
  const referenceCount = await countMemberTagReferences(c, tagId);
  if (referenceCount > 0) return { ok: false, reason: "has_references", referenceCount };
  await c.db.prepare("DELETE FROM tag_definitions WHERE tag_id = ?1").bind(tagId).run();
  return { ok: true, row: current }; // current = 削除前 snapshot
}
```

- 副作用: 参照0 のときのみ `DELETE FROM tag_definitions`。`member_tags` は **touch しない**（参照あり時は削除自体を行わない）。
- 戻り値順序: not_found → has_references → ok の優先順位（不在を最初に弾く）。

> **provider 非変更**: 既存 `TagDefinitionsProvider` は read のみ。route は repository 関数を直接 import するため、provider への write 追加は不要（issue-1035 と同方針）。

---

## 2. `apps/api/src/routes/admin/tags.ts`（編集）

### 2.1 audit action union 拡張（`appendTagAudit` の `input.action` 型）

現状（issue-1035）:
```ts
action: "admin.tag.created" | "admin.tag.updated" | "admin.tag.deactivated";
```

変更後（issue-1070・2 種追加）:
```ts
action:
  | "admin.tag.created"
  | "admin.tag.updated"
  | "admin.tag.deactivated"
  | "admin.tag.reactivated"
  | "admin.tag.physically_deleted";
```

> `AuditAction` は `RepoBrand<string>` のため `auditAction("admin.tag.reactivated")` は brand 型変更不要。route 内 literal union のみ拡張する。

### 2.2 `ERROR_TO_STATUS` 拡張

現状の `ERROR_TO_STATUS` に `tag_has_references: 409` を追加:

```ts
const ERROR_TO_STATUS = {
  invalid_query: 400,
  invalid_json: 400,
  invalid_body: 400,
  no_update_fields: 400,
  tag_not_found: 404,
  tag_code_conflict: 409,
  tag_has_references: 409, // ← 追加（issue-1070 physical delete 参照ガード）
} as const;
```

> `ErrorCode` 型は `keyof typeof ERROR_TO_STATUS` で自動拡張されるため `fail(c, "tag_has_references")` も使える。ただし physical の 409 は `referenceCount` を body に含めるため `fail` ではなく `c.json(...)` で直接返す（§2.4）。

### 2.3 import 追加

既存 import 群に repository 3 関数を追加:

```ts
import {
  createTagDefinition,
  deactivateTagDefinition,
  getTagDefinitionByIdRaw,
  listTagDefinitionsPaged,
  updateTagDefinition,
  reactivateTagDefinition,        // ← 追加
  physicalDeleteTagDefinition,    // ← 追加
  type TagDefinitionRow,
} from "../../repository/tagDefinitions";
```

> `countMemberTagReferences` は `physicalDeleteTagDefinition` 内部で呼ばれるため route から直接 import する必要はない。

### 2.4 route 追加（既存 `app.delete("/tags/:tagId", ...)` の後）

```ts
// ---------------------------------------------------------------------------
// POST /tags/:tagId/reactivate — 再有効化（AC-2 / idempotent）
// ---------------------------------------------------------------------------
app.post("/tags/:tagId/reactivate", async (c) => {
  const tagId = c.req.param("tagId");
  const result = await reactivateTagDefinition(db(c), tagId);
  if (!result) return fail(c, "tag_not_found"); // 404

  if (result.changed) {
    await appendTagAudit(c, {
      action: "admin.tag.reactivated",
      targetId: tagId,
      before: { active: false },
      after: { active: true },
    });
  }
  return c.json(rowBody(result.row), 200); // idempotent でも 200 + 現 row
});

// ---------------------------------------------------------------------------
// DELETE /tags/:tagId/physical — 物理削除（AC-3 / 参照ガード）
//   既存 DELETE /tags/:tagId（論理 active=0）とは別パス。Hono は /physical を
//   静的セグメントとして :tagId より優先解決するため prefix 衝突しない。
// ---------------------------------------------------------------------------
app.delete("/tags/:tagId/physical", async (c) => {
  const tagId = c.req.param("tagId");
  const result = await physicalDeleteTagDefinition(db(c), tagId);

  if (!result.ok && result.reason === "not_found") return fail(c, "tag_not_found"); // 404
  if (!result.ok && result.reason === "has_references") {
    return c.json(
      { ok: false, error: "tag_has_references", referenceCount: result.referenceCount },
      ERROR_TO_STATUS.tag_has_references, // 409
    );
  }

  // result.ok === true
  await appendTagAudit(c, {
    action: "admin.tag.physically_deleted",
    targetId: tagId,
    before: {
      code: result.row.code,
      label: result.row.label,
      category: result.row.category,
      active: result.row.active,
    },
    after: null,
  });
  return c.body(null, 204);
});
```

> **既存 logical DELETE は不変**（AC-6）。`app.delete("/tags/:tagId", ...)` には一切手を入れない。`/tags/:tagId/physical` を追加するだけで Hono が別ルートとして解決する。

### 2.5 audit 発火条件まとめ

| route | 発火 action | 条件 | before / after |
|-------|------------|------|----------------|
| reactivate | `admin.tag.reactivated` | `result.changed===true` のみ（idempotent no-op は発火しない） | `{active:false}` / `{active:true}` |
| physical | `admin.tag.physically_deleted` | `result.ok===true`（削除成功時のみ。not_found / has_references は発火しない） | full row(`{code,label,category,active}`) / `null` |

---

## 3. `docs/00-getting-started-manual/specs/01-api-schema.md`（spec doc 同期）

tag master endpoints セクションに以下を追記する（Phase 2 §2.4）:

- `POST /admin/tags/:tagId/reactivate` — 200 row / 404 / audit `admin.tag.reactivated`（changed 時のみ）/ idempotent。
- `DELETE /admin/tags/:tagId/physical` — 204 / 404 / 409 `tag_has_references`(+referenceCount) / audit `admin.tag.physically_deleted`（成功時のみ）。
- 不変条件: physical delete は `member_tags` 参照ありなら **409 で拒否し孤児を作らない**。logical（active=0 / code 占有継続）と physical（row 削除 / code 解放）の違いを明記。
- migration 不要・参照整合は application-level count が唯一の防壁である旨を記載。

> 本 Phase はコードを正本とし、spec doc は同期記述まで。最終整合確認は Phase 12 Step 2 で行う。

---

## 4. 実装注意チェックリスト（AC 対応）

| 項目 | 実装上の注意 | 確認方法（Phase 4 ケース） |
|------|-------------|---------------------------|
| AC-2 reactivate idempotent | 既 active は UPDATE を発行せず `changed:false` | L-R2 / C-R3（no-op audit 0） |
| AC-2 code conflict 不在 | UNIQUE code 列に触れない | L-R4（spurious 409 不在） |
| AC-3 参照ガード | `countMemberTagReferences>0` で削除前に拒否、member_tags 非 touch | L-P3 / C-P3（409 + referenceCount + row 保持） |
| AC-3 code 解放 | 参照0 削除後に同 code 再作成可 | L-P2 / C-P5（再作成 201） |
| AC-5 audit | reactivate/physical とも state 変化時のみ append | C-R2 / C-R5 / C-P2 / C-P3（拒否時 0） |
| AC-6 logical regression | 既存 `DELETE /tags/:tagId` 無変更 | C-L1..C-L3（active=0 維持・row 残存） |

## 5. GREEN 確認

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.lifecycle.repository.spec.ts \
  apps/api/src/routes/admin/tags.lifecycle.contract.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

全件 PASS かつ typecheck / lint green を GREEN 完了条件とする。

## 6. 成果物

| 成果物 | パス |
|--------|------|
| repository 拡張（型1 + 関数3） | `apps/api/src/repository/tagDefinitions.ts` |
| route 拡張（union + ERROR_TO_STATUS + route2） | `apps/api/src/routes/admin/tags.ts` |
| spec doc 同期 | `docs/00-getting-started-manual/specs/01-api-schema.md` |
