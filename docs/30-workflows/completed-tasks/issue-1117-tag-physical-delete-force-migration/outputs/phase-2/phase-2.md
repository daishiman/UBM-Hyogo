# Phase 2: 設計

## 成果物

強制移行 + 物理削除の二段構成を、repository 関数シグネチャ・route 分岐・SQL 戦略・I/O 契約・audit shape として確定する。

## 2.1 topology / 責務境界

```
DELETE /admin/tags/:tagId/physical
   │
   ├─ query migrateTo 無し ──> physicalDeleteTagDefinition(src)         （issue-1070 既存・不変・AC-7）
   │                              ├─ not_found → 404 tag_not_found
   │                              ├─ refs>0   → 409 tag_has_references   （退化させない）
   │                              └─ refs=0   → DELETE + audit physically_deleted
   │
   └─ query migrateTo=dest ──> forceMigrateAndPhysicalDeleteTagDefinition(src, dest) （新規・二段）
                                  ├─ 検証: src 存在 / dest 存在 / dest active / src≠dest
                                  ├─ migrateMemberTagReferences(src,dest) → {migratedCount}
                                  │     ├─ UPDATE 非衝突行
                                  │     └─ INSERT OR IGNORE + DELETE で衝突行を dest 集約
                                  ├─ audit admin.tag.references_migrated
                                  ├─ countMemberTagReferences(src)===0 を再検証（防御）
                                  └─ physicalDeleteTagDefinition(src) → audit physically_deleted
```

- 層: route → repository。use-case 層なし（既存 admin tag route の慣例に一致）。
- `apps/web` 非接触。新 schema migration なし。

## 2.2 repository 関数シグネチャ（`apps/api/src/repository/tagDefinitions.ts`）

```ts
// 参照移行（衝突吸収込み）。member_tags の src 参照を dest へ全件付け替える。
// 戻り値: 移行（src から消えた）行数。
export async function migrateMemberTagReferences(
  c: DbCtx,
  srcTagId: string,
  destTagId: string,
): Promise<{ migratedCount: number }>;

// 強制移行 + 物理削除の二段オーケストレーション。
export type ForceMigrateAndPhysicalDeleteTagResult =
  | { ok: true; migratedCount: number; row: TagDefinitionRow }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "target_not_found" }
  | { ok: false; reason: "target_inactive" }
  | { ok: false; reason: "same_as_source" }
  | { ok: false; reason: "has_references"; referenceCount: number }; // 移行後 0 にならない異常時の防御

export async function forceMigrateAndPhysicalDeleteTagDefinition(
  c: DbCtx,
  srcTagId: string,
  destTagId: string,
): Promise<ForceMigrateAndPhysicalDeleteTagResult>;
```

- 既存 `countMemberTagReferences` / `physicalDeleteTagDefinition` / `getTagDefinitionByIdRaw` を再利用する。
- `TagDefinitionRow` / `DbCtx` は既存型をそのまま使う。

## 2.3 SQL 戦略（DB-FK 不在前提・application-level）

`member_tags` は `PRIMARY KEY (member_id, tag_id)` のみ。`UPDATE ... SET tag_id=dest` を素朴に全件実行すると、同一 member が src と dest の両方を持つ場合に PK 衝突する。よって 2 ステップに分ける:

```sql
-- Step 1: 衝突しない member は dest が無いので、まず dest 行を冪等に作る（衝突は無視）
INSERT OR IGNORE INTO member_tags (member_id, tag_id)
SELECT member_id, ?dest FROM member_tags WHERE tag_id = ?src;

-- Step 2: src 行を全削除（dest 側に集約済み）
DELETE FROM member_tags WHERE tag_id = ?src;
```

- Step 1 は「src を持つ全 member に dest 行を確保」。既に dest を持つ member（衝突）は `OR IGNORE` でスキップ → 重複生成なし。
- Step 2 で src 行を一掃 → `migratedCount` は Step 2 の 移行前 source 参照数（= 元 src 参照数）。
- `member_tags` の他カラム（`assigned_at` 等があれば）は Step 1 の SELECT 句で明示する。**Phase 5 実装時に実 schema の列を確認して SELECT 句を確定する**（`migrations/0002_admin_managed.sql` の `member_tags` 定義を参照）。
- この 2 ステップは D1 の単一 batch（`c.db.batch([...])`）で原子的に実行し、途中失敗で部分移行が残らないようにする。

### SQL semantics 実測確認（FB-CRONVL-001 準拠）

Phase 4/5 で `INSERT OR IGNORE` の衝突スキップと 移行前 source 参照数 値を D1（miniflare）で実測し、`migratedCount` が「src から消えた行数（衝突分も含む元参照数）」と一致することをテストで固定する。

## 2.4 route 分岐（`apps/api/src/routes/admin/tags.ts`）

```ts
app.delete("/tags/:tagId/physical", async (c) => {
  const tagId = c.req.param("tagId");
  const rawMigrateTo = c.req.query("migrateTo");
  const migrateTo = rawMigrateTo?.trim();

  if (rawMigrateTo !== undefined && migrateTo?.length === 0) {
    return fail(c, "migration_target_not_found");
  }
  if (migrateTo === undefined) {
    // ===== issue-1070 既存経路（不変・AC-7）=====
    const result = await physicalDeleteTagDefinition(db(c), tagId);
    if (!result.ok) {
      if (result.reason === "not_found") return fail(c, "tag_not_found");
      return failWithBody(c, "tag_has_references", { referenceCount: result.referenceCount });
    }
    await appendTagAudit(c, { action: "admin.tag.physically_deleted", targetId: tagId, before: rowBody(result.row), after: null });
    return c.body(null, 204);
  }

  // ===== 強制移行経路（新規）=====
  const result = await forceMigrateAndPhysicalDeleteTagDefinition(db(c), tagId, migrateTo);
  if (!result.ok) {
    switch (result.reason) {
      case "not_found": return fail(c, "tag_not_found");
      case "target_not_found": return fail(c, "migration_target_not_found");
      case "target_inactive": return failWithBody(c, "migration_target_inactive", { migrateTo });
      case "same_as_source": return fail(c, "migration_target_same_as_source");
      case "has_references": return failWithBody(c, "tag_has_references", { referenceCount: result.referenceCount });
    }
  }
  await appendTagAudit(c, {
    action: "admin.tag.references_migrated",
    targetId: tagId,
    before: { tag_id: tagId, dest: migrateTo, referenceCount: result.migratedCount },
    after: { migratedCount: result.migratedCount, deleted: true },
  });
  await appendTagAudit(c, {
    action: "admin.tag.physically_deleted",
    targetId: tagId,
    before: rowBody(result.row),
    after: null,
  });
  return c.body(null, 204);
});
```

### error code 追加（`ERROR_TO_STATUS`、`tags.ts:59` 付近）

```ts
migration_target_not_found: 404,
migration_target_inactive: 409,
migration_target_same_as_source: 400,
```

## 2.5 I/O 契約

| 項目 | 入力 | 出力（成功） | 出力（失敗） | 副作用 |
|------|------|--------------|--------------|--------|
| `migrateMemberTagReferences` | `src`, `dest`（共に存在前提） | `{migratedCount}` | （呼び出し側で検証済） | `member_tags` の src→dest 付け替え（batch） |
| `forceMigrateAndPhysicalDeleteTagDefinition` | `src`, `dest` | `{ok:true, migratedCount, row}` | `{ok:false, reason}` | 移行 + `tag_definitions` から src 削除 |
| `DELETE .../physical?migrateTo=dest` | path `tagId`=src, query `migrateTo`=dest | `204` | 400/404/409 + body | audit 2 件（移行 + 削除） |

- 副作用の冪等性: 同一 (src,dest) を再実行すると 2 回目は src 不在で `tag_not_found`（404）。移行は src 行が消えているため再実行されない。

## 2.6 audit shape

| action | before_json | after_json | target_type/id |
|--------|-------------|------------|----------------|
| `admin.tag.references_migrated` | `{tag_id:src, dest, referenceCount}` | `{migratedCount, deleted:true}` | `tag` / src |
| `admin.tag.physically_deleted` | 削除前 full row | `null` | `tag` / src |

- actor は既存 `appendTagAudit` → `auditLog.ts` の actor 記録経路で残る（AC-4 の「実行者」充足）。

## 2.7 既存コンポーネント再利用（FB-SDK-07-1）

- 新規 UI なし。repository は既存 `countMemberTagReferences` / `physicalDeleteTagDefinition` / `getTagDefinitionByIdRaw` を再利用。
- route は既存 `DELETE /tags/:tagId/physical` に query 分岐を足すだけで新 path を増やさない（contract surface 最小化）。
- audit は既存 `appendTagAudit` を再利用。

## 2.8 内部型 → 公開 error code 変換表（FB-SDK-07-2 / SC-13-2）

| 内部 `ForceMigrateAndPhysicalDeleteTagResult.reason` | 公開 error code | HTTP |
|----------------------------------|-----------------|------|
| `not_found` | `tag_not_found` | 404 |
| `target_not_found` | `migration_target_not_found` | 404 |
| `target_inactive` | `migration_target_inactive` | 409 |
| `same_as_source` | `migration_target_same_as_source` | 400 |
| `has_references` | `tag_has_references` | 409 |
