# Phase 5: 実装（TDD GREEN）

> Phase 4 の RED テストを全件 PASS させる。実装区分 NON_VISUAL。
> SQL・関数シグネチャは [Phase 2](../phase-2/phase-2.md) をコントラクトとして写像する。
> route → repository 直結（use-case 層なし。既存 admin tag route 慣例）。
> 「canUseTool 適用範囲」等 SDK 項目は該当なし。
> issue-1070 で landed 済みの `countMemberTagReferences`（`tagDefinitions.ts:210`）/ `physicalDeleteTagDefinition`（`tagDefinitions.ts:223-237`）/ `DELETE /tags/:tagId/physical`（`tags.ts:267-284`）への **追記・前段追加** であり、既存 surface は不変（AC-7）。

## 0. 新規作成 / 修正ファイル一覧（FB-RT-03 必須）

| # | パス | 種別 | 概要 |
|---|------|------|------|
| 1 | `apps/api/src/repository/tagDefinitions.ts` | **編集** | 型 `ForceMigrateAndPhysicalDeleteTagResult` + 関数 2（`migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition`）を `physicalDeleteTagDefinition` 直後に追加 |
| 2 | `apps/api/src/routes/admin/tags.ts` | **編集** | `ERROR_TO_STATUS` に新 error code 3 件追加 + `appendTagAudit` action union に `admin.tag.references_migrated` 追加 + `DELETE /tags/:tagId/physical` に `?migrateTo` 分岐追加 + import 追加 |
| 3 | `docs/00-getting-started-manual/specs/01-api-schema.md` | **編集** | tag master endpoints に `?migrateTo` 強制移行経路・新 error code・新 audit action・参照ガード不変条件を追記（Phase 12 Step 2 で最終整合・本 Phase はコード優先） |

> **新規ファイルなし**（**新規 migration なし**・Phase 2 §2.3）。`apps/web` 非接触。`auditLog.ts` の `AuditTargetType` は既に `"tag"` を含むため型変更不要。`AuditAction` は `RepoBrand<string>` のため brand 型変更不要。

---

## 1. `apps/api/src/repository/tagDefinitions.ts`（編集）

### 1.1 追加する型（`PhysicalDeleteTagDefinitionResult` の近傍 = `tagDefinitions.ts:221` 付近）

```ts
// issue-1117: 強制移行 + 物理削除の二段オーケストレーション結果。
//   ok:true は移行件数 + 削除前 row snapshot（audit before 用）を返す。
//   ok:false は route 側で error code/HTTP へ変換（Phase 2 §2.8 の変換表）。
export type ForceMigrateAndPhysicalDeleteTagResult =
  | { ok: true; row: TagDefinitionRow; sourceReferenceCount: number; migratedCount: number }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "target_not_found" }
  | { ok: false; reason: "target_inactive" }
  | { ok: false; reason: "same_as_source" }
  | { ok: false; reason: "has_references"; referenceCount: number };
```

### 1.2 `migrateMemberTagReferences`（新規・参照付け替え・衝突吸収）

`physicalDeleteTagDefinition`（`:237`）直後に追加する。`member_tags` の実列は migration（`0002_admin_managed.sql:43-51`）で確認済み = `member_id, tag_id, source, confidence, assigned_at, assigned_by`、PK `(member_id, tag_id)` のみ・FK なし。

> **note**: 以下は landed 済みの実コード（`apps/api/src/repository/tagDefinitions.ts`）を正本として転記したもの。`migratedCount` は batch 結果の `meta.changes` ではなく、**移行前に `countMemberTagReferences` で計測した `sourceReferenceCount`** から導く（D1 の batch 戻り値が driver 差で安定しないため、件数源を明示計測に一本化）。返却型は `MigrateMemberTagReferencesResult = { sourceReferenceCount; migratedCount }`。`c.db.batch` 未提供の driver（unit fake）では `insert.run()` → `delete.run()` の逐次実行へ fallback する。

```ts
export interface MigrateMemberTagReferencesResult {
  sourceReferenceCount: number;
  migratedCount: number;
}

/**
 * member_tags の source 参照を destination 参照へ全件付け替える（衝突吸収込み）。
 *   member_tags に DB-FK が無く PK (member_id, tag_id) のみのため、UPDATE 一発では
 *   src/dest 両持ち member で PK 衝突する。よって 2 ステップに分ける:
 *     Step1: src を持つ全 member に dest 行を冪等確保（INSERT OR IGNORE で衝突 member はスキップ）
 *     Step2: src 行を全削除（dest 側に集約済み）
 *   件数は移行前に countMemberTagReferences で測り sourceReferenceCount/migratedCount とする。
 *   2 ステップは c.db.batch で原子実行し、部分移行を残さない（batch 未提供時は逐次 fallback）。
 * 前提: src/dest の存在・active・src≠dest は呼び出し側（forceMigrateAndPhysicalDeleteTagDefinition）で検証済み。
 */
export async function migrateMemberTagReferences(
  c: DbCtx,
  sourceTagId: string,
  destinationTagId: string,
): Promise<MigrateMemberTagReferencesResult> {
  const sourceReferenceCount = await countMemberTagReferences(c, sourceTagId);
  if (sourceReferenceCount === 0) {
    return { sourceReferenceCount, migratedCount: 0 };
  }

  const insertDestinationRows = c.db
    .prepare(
      `INSERT OR IGNORE INTO member_tags
        (member_id, tag_id, source, confidence, assigned_at, assigned_by)
       SELECT member_id, ?2, source, confidence, assigned_at, assigned_by
       FROM member_tags
       WHERE tag_id = ?1`,
    )
    .bind(sourceTagId, destinationTagId);
  const deleteSourceRows = c.db
    .prepare("DELETE FROM member_tags WHERE tag_id = ?1")
    .bind(sourceTagId);

  if (c.db.batch) {
    await c.db.batch([insertDestinationRows, deleteSourceRows]);
  } else {
    await insertDestinationRows.run();
    await deleteSourceRows.run();
  }
  return { sourceReferenceCount, migratedCount: sourceReferenceCount };
}
```

- 入力: `sourceTagId`, `destinationTagId`（存在・検証済み前提）。出力: `{sourceReferenceCount, migratedCount}`。副作用: `member_tags` の src→dest 付け替え（batch 原子実行・未提供時は逐次）。
- `assigned_at` は SELECT 句で src 行の値を**明示引き継ぎ**（Step1 の新規 dest 行）。衝突 member の既存 dest 行は `OR IGNORE` で touch しないため元の `assigned_at` を保持。
- **SELECT 句の列は migration の実 `member_tags` 定義に一致させる**（`source, confidence, assigned_at, assigned_by`）。実装時に `migrations/0002_admin_managed.sql:43-51` を再確認して列ずれがないこと（Phase 3 §3.2 リスク対策）。

### 1.3 `forceMigrateAndPhysicalDeleteTagDefinition`（新規・二段オーケストレーション）

`migrateMemberTagReferences` 直後に追加する。既存 `getTagDefinitionByIdRaw` / `countMemberTagReferences` / `physicalDeleteTagDefinition` を再利用する。

```ts
/**
 * 参照付き tag の強制移行 + 物理削除（二段）。
 *   1) 移行先検証（src 存在 / dest 存在 / dest active / src≠dest）
 *   2) migrateMemberTagReferences で src→dest 付け替え
 *   3) countMemberTagReferences(src)===0 を再検証（DB-FK 不在のすり抜け防御）
 *   4) physicalDeleteTagDefinition(src) で元 tag 削除
 * 不可逆: production 実行は user-gated（runbook）。
 */
export async function forceMigrateAndPhysicalDeleteTagDefinition(
  c: DbCtx,
  srcTagId: string,
  destTagId: string,
): Promise<ForceMigrateAndPhysicalDeleteTagResult> {
  if (srcTagId === destTagId) return { ok: false, reason: "same_as_source" };

  const src = await getTagDefinitionByIdRaw(c, srcTagId);
  if (!src) return { ok: false, reason: "not_found" };

  const dest = await getTagDefinitionByIdRaw(c, destTagId);
  if (!dest) return { ok: false, reason: "target_not_found" };
  if (!dest.active) return { ok: false, reason: "target_inactive" };

  const { migratedCount } = await migrateMemberTagReferences(c, srcTagId, destTagId);

  // 防御: 移行後 src 参照が 0 でないなら削除へ進まない（孤児化禁止）。
  const remaining = await countMemberTagReferences(c, srcTagId);
  if (remaining > 0) {
    return { ok: false, reason: "has_references", referenceCount: remaining };
  }

  const deleted = await physicalDeleteTagDefinition(c, srcTagId);
  if (!deleted.ok) {
    // src 参照 0 を確認済みのため通常 not_found のみ。移行後の race を防御で返す。
    if (deleted.reason === "has_references") {
      return { ok: false, reason: "has_references", referenceCount: deleted.referenceCount };
    }
    return { ok: false, reason: "not_found" };
  }
  return { ok: true, migratedCount, row: deleted.row };
}
```

- 検証順序: `same_as_source` → `not_found` → `target_not_found` → `target_inactive` → 移行 → `has_references` 防御 → 削除。最初に弾けるものを先に弾く。
- 副作用順序: 移行（member_tags 付け替え）→ 削除（tag_definitions から src 削除）。移行のみ済んで削除失敗した場合も dest へ参照が寄った状態は不正でない（runbook で逆移行可能）。
- 既存 `physicalDeleteTagDefinition` を **再利用**（削除 SQL とガードを二重実装しない）。`row` は削除前 snapshot（audit before 用）。

---

## 2. `apps/api/src/routes/admin/tags.ts`（編集）

### 2.1 `ERROR_TO_STATUS` 拡張（`tags.ts:52-61`）

既存 map に 3 件追加:

```ts
const ERROR_TO_STATUS = {
  invalid_query: 400,
  invalid_json: 400,
  invalid_body: 400,
  no_update_fields: 400,
  tag_not_found: 404,
  tag_code_conflict: 409,
  tag_has_references: 409,
  tag_stale_conflict: 409,
  migration_target_not_found: 404,       // ← 追加（AC-5）
  migration_target_inactive: 409,        // ← 追加（AC-5）
  migration_target_same_as_source: 400,  // ← 追加（AC-5）
} as const;
```

> `ErrorCode = keyof typeof ERROR_TO_STATUS`（`tags.ts:63`）で自動拡張されるため `fail(c, "migration_target_not_found")` / `failWithBody(...)` がそのまま使える。

### 2.2 audit action union 拡張（`appendTagAudit` の `input.action`・`tags.ts:110-115`）

現状（既存）に `admin.tag.references_migrated` を 1 件追加:

```ts
action:
  | "admin.tag.created"
  | "admin.tag.updated"
  | "admin.tag.deactivated"
  | "admin.tag.reactivated"
  | "admin.tag.physically_deleted"
  | "admin.tag.code_renamed"
  | "admin.tag.references_migrated"; // ← 追加（AC-4）
```

### 2.3 import 追加

既存 repository import 群に `forceMigrateAndPhysicalDeleteTagDefinition` を追加（`physicalDeleteTagDefinition` は既に import 済み）:

```ts
import {
  // ... 既存（createTagDefinition / physicalDeleteTagDefinition / ...）
  forceMigrateAndPhysicalDeleteTagDefinition,  // ← 追加
} from "../../repository/tagDefinitions";
```

> `migrateMemberTagReferences` は `forceMigrateAndPhysicalDeleteTagDefinition` 内部で呼ばれるため route から直接 import 不要。

### 2.4 `DELETE /tags/:tagId/physical` への `?migrateTo` 分岐（既存 handler `tags.ts:267-284` を置換）

既存 handler 冒頭に query 分岐を足す。**`migrateTo` 未指定パスは既存実装を完全保持（AC-7）**。

```ts
app.delete("/tags/:tagId/physical", async (c) => {
  const tagId = c.req.param("tagId");
  const rawMigrateTo = c.req.query("migrateTo");
  const migrateTo = rawMigrateTo?.trim();

  // ===== 強制移行経路（新規・migrateTo 指定時のみ）=====
  if (rawMigrateTo !== undefined && migrateTo?.length === 0) {
    return fail(c, "migration_target_not_found");
  }
  if (migrateTo !== undefined) {
    const result = await forceMigrateAndPhysicalDeleteTagDefinition(db(c), tagId, migrateTo);
    if (!result.ok) {
      switch (result.reason) {
        case "not_found":
          return fail(c, "tag_not_found");
        case "target_not_found":
          return fail(c, "migration_target_not_found");
        case "target_inactive":
          return failWithBody(c, "migration_target_inactive", { migrateTo });
        case "same_as_source":
          return fail(c, "migration_target_same_as_source");
        case "has_references":
          return failWithBody(c, "tag_has_references", { referenceCount: result.referenceCount });
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
  }

  // ===== issue-1070 既存経路（migrateTo 未指定・不変・AC-7）=====
  const result = await physicalDeleteTagDefinition(db(c), tagId);
  if (!result.ok) {
    if (result.reason === "not_found") return fail(c, "tag_not_found");
    return failWithBody(c, "tag_has_references", {
      referenceCount: result.referenceCount,
    });
  }
  await appendTagAudit(c, {
    action: "admin.tag.physically_deleted",
    targetId: tagId,
    before: rowBody(result.row),
    after: null,
  });
  return c.body(null, 204);
});
```

> **後半（migrateTo 未指定）の 6 行は既存コードそのまま**（`tags.ts:269-283`）。query 分岐の `if (migrateTo)` を前段に積むだけで既存挙動は退化しない（AC-7）。
> `before: { tag_id, dest, referenceCount }` の `referenceCount` は `migratedCount`（= 移行した件数 = 元 src 参照数）を採用（Phase 2 §2.6 audit shape）。

### 2.5 audit 発火条件まとめ

| route | 発火 action | 条件 | before / after |
|-------|------------|------|----------------|
| physical `?migrateTo` 指定・成功 | `admin.tag.references_migrated` + `admin.tag.physically_deleted` | `forceMigrateAndPhysicalDeleteTagDefinition` の `ok:true` のみ（拒否時は両方発火しない） | migrated: `{tag_id,dest,referenceCount}`/`{migratedCount,deleted:true}`、deleted: full row / `null` |
| physical `?migrateTo` 未指定 | `admin.tag.physically_deleted` | 既存どおり（参照0 削除成功時のみ） | full row / `null`（不変） |

---

## 3. `docs/00-getting-started-manual/specs/01-api-schema.md`（spec doc 同期）

tag master endpoints セクションに以下を追記する（Phase 2 §2.4）:

- `DELETE /admin/tags/:tagId/physical?migrateTo=<destTagId>` — 強制移行経路。`member_tags` の `src` 参照を `dest` へ全件移行（衝突 member は dest 側へ集約・孤児なし）してから src を物理削除。204 / 404 `tag_not_found` / 404 `migration_target_not_found` / 409 `migration_target_inactive` / 400 `migration_target_same_as_source` / 409 `tag_has_references`（移行後 0 にならない異常時の防御）。
- audit: `admin.tag.references_migrated`（before=`{tag_id:src, dest, referenceCount}`、after=`{migratedCount, deleted:true}`）+ `admin.tag.physically_deleted`（成功時のみ・before=full row / after=null）。
- 不変条件: `migrateTo` 未指定は issue-1070 既存挙動（参照ありは 409 `tag_has_references` で拒否・移行しない）を完全保持（AC-7）。
- migration 不要・移行先は実行時指定の可変値・参照整合は application-level SQL（`INSERT OR IGNORE`+`DELETE` の batch）と移行後 `COUNT=0` 再検証が唯一の防壁である旨を記載。

> 本 Phase はコードを正本とし、spec doc は同期記述まで。最終整合確認は Phase 12 Step 2 で行う。

---

## 4. 実装注意チェックリスト（AC 対応）

| 項目 | 実装上の注意 | 確認方法（Phase 4 ケース） |
|------|-------------|---------------------------|
| AC-1 移行 | `migrateMemberTagReferences` の SELECT 列は実 `member_tags` 定義（`source,confidence,assigned_by`）に一致 | FM-R1 / FM-1 / FM-C1 |
| AC-2 衝突吸収 | `INSERT OR IGNORE`+`DELETE` の 2 ステップで dest 集約・PK 重複行を生成しない | FM-R2 / FM-R3 |
| AC-3 二段削除 | 移行後 `countMemberTagReferences(src)===0` 再検証後のみ `physicalDeleteTagDefinition` | FM-1 / FM-6 |
| AC-4 audit | 成功時のみ migrated + physically_deleted を 2 件 append | FM-C2 / AUDIT-1 |
| AC-5 移行先検証 | `same_as_source`/`not_found`/`target_not_found`/`target_inactive` を移行前に弾く | FM-2..FM-5 / FM-C3..FM-C5 |
| AC-7 退化防止 | `migrateTo` 未指定パスは既存 6 行を一切変更しない | AC7-1 / AC7-2 |
| 原子性 | 移行 SQL を `c.db.batch` で 1 回実行・部分移行を残さない | FM-R2（src=0 / dest 集約） |
| 移行前 source 参照数 実測 | `migratedCount` は Step2 移行前 source 参照数 | FM-R4 |

## 5. GREEN 確認

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

全件 PASS かつ typecheck / lint green を GREEN 完了条件（DoD）とする。

## 6. 成果物

| 成果物 | パス |
|--------|------|
| repository 拡張（型1 + 関数2） | `apps/api/src/repository/tagDefinitions.ts` |
| route 拡張（ERROR_TO_STATUS 3 + audit union 1 + `?migrateTo` 分岐） | `apps/api/src/routes/admin/tags.ts` |
| spec doc 同期 | `docs/00-getting-started-manual/specs/01-api-schema.md` |
