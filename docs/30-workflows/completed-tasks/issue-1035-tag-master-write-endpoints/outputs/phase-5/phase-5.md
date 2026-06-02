# Phase 5: 実装（TDD GREEN）

> Phase 4 の RED テストを全件 PASS させる。実装区分 NON_VISUAL。
> SQL・関数シグネチャは [Phase 2](../phase-2/phase-2.md) をコントラクトとして写像する。
> route → repository 直結（use-case 層なし。既存 admin route 慣例）。
> 「canUseTool 適用範囲」等 SDK 項目は該当なし。

## 0. 新規作成 / 修正ファイル一覧（FB-RT-03）

| # | パス | 種別 | 概要 |
|---|------|------|------|
| 1 | `apps/api/src/repository/tagDefinitions.ts` | 編集 | 型 4 + write/read 関数 5 + 不変条件 #13 コメント改訂 + provider 拡張 |
| 2 | `apps/api/src/repository/auditLog.ts` | 編集 | `AuditTargetType` に `"tag"` 追加 |
| 3 | `apps/api/src/routes/admin/tags.ts` | 新規 | tag master CRUD route（GET/POST/PATCH/DELETE）+ zod |
| 4 | `apps/api/src/index.ts` | 編集 | `adminTagsRoute` import + `app.route("/admin", adminTagsRoute)`（mount 順注意） |

> **新規 migration なし**（`active` カラムは migration 0002 で既存）。`docs/00-getting-started-manual/specs/01-api-schema.md` の更新は Phase 12 Step 2 で扱う（本 Phase はコードのみ）。

---

## 1. `apps/api/src/repository/tagDefinitions.ts`（編集）

### 1.1 不変条件 #13 コメント改訂（現 48 行目を置換）

**変更前**:
```ts
// 不変条件 #13: write API は提供しない。seed は 01a で投入済み。
```

**変更後**（Phase 2 §2.2）:
```ts
// 不変条件 #13（2026-06 再々定義 / issue-1035）:
//   tag master (tag_definitions) の write は「管理者による tag master CRUD」経路として
//   本ファイルの createTagDefinition / updateTagDefinition / deactivateTagDefinition のみ許可する。
//   いずれも admin 専用 route (/admin/tags) から audit (admin.tag.created/updated/deactivated)
//   付きで呼ぶこと。code は immutable（UPDATE 対象は label/category のみ）。論理削除は active=0
//   とし、member_tags の既存 row は保持する。それ以外の write 経路を生やす場合は不変条件 #13
//   自体の変更レビューを経ること。
```

### 1.2 追加する型（既存 `TagDefinitionRow` の直後）

```ts
export interface CreateTagDefinitionInput {
  code: string;
  label: string;
  category: string;
}

export interface UpdateTagDefinitionInput {
  label?: string;
  category?: string;
}

export type CreateTagDefinitionResult =
  | { ok: true; row: TagDefinitionRow }
  | { ok: false; reason: "code_conflict" };

export interface PagedTagDefinitions {
  total: number;
  items: TagDefinitionRow[];
}
```

### 1.3 追加する write/read 関数

> `SELECT_COLS` / `map` / `DbRow` / `TagDefinitionRow` は既存定義を再利用する。

```ts
/**
 * tag_id で 1 件取得（active フィルタ無し = inactive も検出）。
 * update/delete の存在確認用。既存 findByCode は code 用なので id 版を別途追加する。
 */
export async function getTagDefinitionByIdRaw(
  c: DbCtx,
  tagId: string,
): Promise<TagDefinitionRow | null> {
  const r = await c.db
    .prepare(`${SELECT_COLS} WHERE tag_id = ?1`)
    .bind(tagId)
    .first<DbRow>();
  return r ? map(r) : null;
}

/**
 * tag master を新規作成する。code は UNIQUE。衝突時は { ok:false, reason:"code_conflict" }。
 * tag_id は crypto.randomUUID()。active=1 / source_stable_keys_json='[]' 固定。
 */
export async function createTagDefinition(
  c: DbCtx,
  input: CreateTagDefinitionInput,
): Promise<CreateTagDefinitionResult> {
  const tagId = crypto.randomUUID();
  try {
    await c.db
      .prepare(
        `INSERT INTO tag_definitions
           (tag_id, code, label, category, source_stable_keys_json, active)
         VALUES (?1, ?2, ?3, ?4, '[]', 1)`,
      )
      .bind(tagId, input.code, input.label, input.category)
      .run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/UNIQUE/i.test(msg)) {
      return { ok: false, reason: "code_conflict" };
    }
    throw err; // UNIQUE 以外の DB error は握り潰さない
  }
  return {
    ok: true,
    row: {
      tagId,
      code: input.code,
      label: input.label,
      category: input.category,
      sourceStableKeysJson: "[]",
      active: true,
    },
  };
}

/**
 * tag master の label / category を更新する（code は immutable）。
 * 対象 tag_id が存在しなければ null。両フィールド undefined（更新項目なし）の場合も
 * 現在行をそのまま返す（no-op）。active 状態は変更しない。
 */
export async function updateTagDefinition(
  c: DbCtx,
  tagId: string,
  input: UpdateTagDefinitionInput,
): Promise<TagDefinitionRow | null> {
  const current = await getTagDefinitionByIdRaw(c, tagId);
  if (!current) return null;

  const sets: string[] = [];
  const binds: string[] = [];
  if (input.label !== undefined) {
    sets.push(`label = ?${binds.length + 2}`); // ?1 は tag_id 用に予約
    binds.push(input.label);
  }
  if (input.category !== undefined) {
    sets.push(`category = ?${binds.length + 2}`);
    binds.push(input.category);
  }
  if (sets.length === 0) {
    // no-op（更新項目なし）: 現在行をそのまま返す
    return current;
  }
  await c.db
    .prepare(`UPDATE tag_definitions SET ${sets.join(", ")} WHERE tag_id = ?1`)
    .bind(tagId, ...binds)
    .run();
  return getTagDefinitionByIdRaw(c, tagId);
}

/**
 * tag master を論理削除する（active=0）。member_tags は触らない。
 * 戻り値: 対象不在=null / 既に active=0=既存値 row（changed=false）/ active=1→0=更新後 row（changed=true）。
 * 冪等性のため { row, changed } を返し、route は changed 時のみ audit する。
 */
export async function deactivateTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<{ row: TagDefinitionRow; changed: boolean } | null> {
  const current = await getTagDefinitionByIdRaw(c, tagId);
  if (!current) return null;
  if (current.active === false) {
    return { row: current, changed: false };
  }
  const result = await c.db
    .prepare(`UPDATE tag_definitions SET active = 0 WHERE tag_id = ?1 AND active = 1`)
    .bind(tagId)
    .run();
  const changed = (result.meta?.changes ?? 0) > 0;
  const updated = await getTagDefinitionByIdRaw(c, tagId);
  // updated は直前に存在確認済みのため null にならないが、型安全のため current にフォールバック
  return { row: updated ?? current, changed };
}

/**
 * tag master を pagination + search で一覧。q は code/label の部分一致（LOWER で大小無視）。
 * inactive も含めて返す（master 管理ビュー）。total はフィルタ適用後の総件数。
 * page は 1 始まり、pageSize は呼び出し側で上限を保証する。
 */
export async function listTagDefinitionsPaged(
  c: DbCtx,
  opts: { q?: string; page: number; pageSize: number },
): Promise<PagedTagDefinitions> {
  const q = opts.q?.trim();
  const hasQ = q !== undefined && q !== "";
  const like = hasQ ? `%${q.toLowerCase()}%` : null;

  // WHERE 句は q 有無で 2 系統。bind 値も合わせる。
  const whereSql = hasQ
    ? `WHERE (LOWER(code) LIKE ?1 OR LOWER(label) LIKE ?1)`
    : ``;

  // total
  const countStmt = c.db.prepare(
    `SELECT COUNT(*) AS n FROM tag_definitions ${whereSql}`,
  );
  const countRow = hasQ
    ? await countStmt.bind(like).first<{ n: number }>()
    : await countStmt.first<{ n: number }>();
  const total = countRow?.n ?? 0;

  // items（LIMIT/OFFSET）
  const offset = (opts.page - 1) * opts.pageSize;
  const itemsSql = `${SELECT_COLS} ${whereSql} ORDER BY category ASC, label ASC LIMIT ? OFFSET ?`;
  const itemsStmt = c.db.prepare(itemsSql);
  const itemsRes = hasQ
    ? await itemsStmt.bind(like, opts.pageSize, offset).all<DbRow>()
    : await itemsStmt.bind(opts.pageSize, offset).all<DbRow>();
  return { total, items: (itemsRes.results ?? []).map(map) };
}
```

> **注（bind プレースホルダ）**: `updateTagDefinition` の動的 SQL は `?1` を tag_id（WHERE）に予約し、SET 句は `?2` から振る。`binds.length + 2` でオフセットを取り、`bind(tagId, ...binds)` の順序と一致させる。
>
> **注（listTagDefinitionsPaged の `?1` 再利用）**: D1/SQLite は同一 numbered placeholder `?1` を複数箇所で参照できるため、code/label 両方を 1 bind 値で評価する。count 用と items 用は別 prepared statement にする。

### 1.4 provider 拡張（任意・最小）

既存 `TagDefinitionsProvider` / `createTagDefinitionsProvider` は read 3 関数のみ。本タスクの route は repository 関数を **直接 import** して呼ぶ（members.ts と同じく D1 直アクセスは `ctx({ DB })` 経由）。provider への write 追加は不要（tagQueueResolve workflow が provider 経由で read のみ使うため、write を provider に足すと不要な surface 拡張になる）。

→ **provider は変更しない**（read 3 関数のまま）。route は `import { createTagDefinition, ... } from "../../repository/tagDefinitions"` で直接呼ぶ。

---

## 2. `apps/api/src/repository/auditLog.ts`（編集）

`AuditTargetType` union（8-14 行目）に `"tag"` を追加（Phase 2 §3）:

```ts
export type AuditTargetType =
  | "member"
  | "admin_member_note"
  | "tag_queue"
  | "tag"          // ← 追加（issue-1035 tag master CRUD）
  | "schema_diff"
  | "meeting"
  | "system";
```

> `AuditAction` は `RepoBrand<string>` で enum 制約が無いため `auditAction("admin.tag.created")` 等は型変更不要。

---

## 3. `apps/api/src/routes/admin/tags.ts`（新規）

`tags-queue.ts` / `members.ts` の構造に揃える。

```ts
// issue-1035: tag master (tag_definitions) の admin CRUD route。
// 不変条件 #13（2026-06 再々定義）:
//   tag master の write は本 route → repository (createTagDefinition / updateTagDefinition /
//   deactivateTagDefinition) のみ。各 write は audit (admin.tag.created/updated/deactivated) を
//   target_type='tag' で 1 件記録する（state 変化時のみ）。code は immutable。論理削除は
//   active=0 で member_tags は保持する。
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import { adminEmail, asAdminId } from "../../repository/_shared/brand";
import { ctx } from "../../repository/_shared/db";
import {
  writeTagNoteProviderMiddleware,
  type WriteTagNoteProviderVariables,
} from "../../middleware/repository-providers";
import { requireProvider } from "../../repository/_shared/provider-context";
import { auditAction } from "../../repository/_shared/brand";
import {
  createTagDefinition,
  updateTagDefinition,
  deactivateTagDefinition,
  listTagDefinitionsPaged,
  getTagDefinitionByIdRaw,
} from "../../repository/tagDefinitions";
import type { AdminRouteEnv } from "./_shared";

// member tags の既存 code 慣例（biz_food / engineer 等）
const CODE_RE = /^[a-z0-9][a-z0-9_]*$/;

const CreateTagBodyZ = z.object({
  code: z.string().min(1).max(64).regex(CODE_RE),
  label: z.string().min(1).max(120),
  category: z.string().min(1).max(64),
});

const UpdateTagBodyZ = z
  .object({
    // code は schema に含めない（immutable / strip）
    label: z.string().min(1).max(120).optional(),
    category: z.string().min(1).max(64).optional(),
  })
  .refine((b) => b.label !== undefined || b.category !== undefined, {
    message: "no_update_fields",
  });

const ListTagsQueryZ = z.object({
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const createAdminTagsRoute = () => {
  const app = new Hono<{
    Bindings: AdminRouteEnv;
    Variables: RequireAuthVariables & Partial<WriteTagNoteProviderVariables>;
  }>();
  app.use("*", requireAdmin);
  app.use("*", writeTagNoteProviderMiddleware); // auditLogProvider を bind

  // ---------------------------------------------------------------------------
  // GET /tags — 一覧（AC-4）
  // ---------------------------------------------------------------------------
  app.get("/tags", async (c) => {
    const parsed = ListTagsQueryZ.safeParse({
      q: c.req.query("q"),
      page: c.req.query("page"),
      pageSize: c.req.query("pageSize"),
    });
    if (!parsed.success) {
      return c.json({ ok: false, error: "invalid_query" }, 400);
    }
    const db = ctx({ DB: c.env.DB });
    const opts: { q?: string; page: number; pageSize: number } = {
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    };
    if (parsed.data.q !== undefined) opts.q = parsed.data.q;
    const result = await listTagDefinitionsPaged(db, opts);
    return c.json(result, 200);
  });

  // ---------------------------------------------------------------------------
  // POST /tags — 作成（AC-1）
  // ---------------------------------------------------------------------------
  app.post("/tags", async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid_json" }, 400);
    }
    const parsed = CreateTagBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: "invalid_body" }, 400);
    }
    const { code, label, category } = parsed.data;

    const db = ctx({ DB: c.env.DB });
    const created = await createTagDefinition(db, { code, label, category });
    if (!created.ok) {
      return c.json({ ok: false, error: "tag_code_conflict" }, 409);
    }

    const authUser = c.get("authUser");
    await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
      actorId: asAdminId(authUser.memberId),
      actorEmail: adminEmail(authUser.email),
      action: auditAction("admin.tag.created"),
      targetType: "tag",
      targetId: created.row.tagId,
      before: null,
      after: { code, label, category },
    });

    return c.json(
      {
        tagId: created.row.tagId,
        code: created.row.code,
        label: created.row.label,
        category: created.row.category,
        active: created.row.active,
      },
      201,
    );
  });

  // ---------------------------------------------------------------------------
  // PATCH /tags/:tagId — 更新（AC-2 / code immutable）
  // ---------------------------------------------------------------------------
  app.patch("/tags/:tagId", async (c) => {
    const tagId = c.req.param("tagId");
    if (!tagId) return c.json({ ok: false, error: "missing_tagId" }, 400);

    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid_json" }, 400);
    }
    const parsed = UpdateTagBodyZ.safeParse(raw);
    if (!parsed.success) {
      // refine の no_update_fields も含め 400 に集約。
      const isNoFields = parsed.error.issues.some((i) => i.message === "no_update_fields");
      return c.json(
        { ok: false, error: isNoFields ? "no_update_fields" : "invalid_body" },
        400,
      );
    }

    const db = ctx({ DB: c.env.DB });
    const before = await getTagDefinitionByIdRaw(db, tagId);
    if (!before) {
      return c.json({ ok: false, error: "tag_not_found" }, 404);
    }

    const input: { label?: string; category?: string } = {};
    if (parsed.data.label !== undefined) input.label = parsed.data.label;
    if (parsed.data.category !== undefined) input.category = parsed.data.category;
    const updated = await updateTagDefinition(db, tagId, input);
    // before が存在したので updated は null にならない（型ガード）
    const row = updated ?? before;

    // 実値が変化した時のみ audit（AC-5 / C-5）
    const changed = row.label !== before.label || row.category !== before.category;
    if (changed) {
      const authUser = c.get("authUser");
      await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
        actorId: asAdminId(authUser.memberId),
        actorEmail: adminEmail(authUser.email),
        action: auditAction("admin.tag.updated"),
        targetType: "tag",
        targetId: tagId,
        before: { label: before.label, category: before.category },
        after: { label: row.label, category: row.category },
      });
    }

    return c.json(
      {
        tagId: row.tagId,
        code: row.code,
        label: row.label,
        category: row.category,
        active: row.active,
      },
      200,
    );
  });

  // ---------------------------------------------------------------------------
  // DELETE /tags/:tagId — 論理削除（AC-3 / 冪等）
  // ---------------------------------------------------------------------------
  app.delete("/tags/:tagId", async (c) => {
    const tagId = c.req.param("tagId");
    if (!tagId) return c.json({ ok: false, error: "missing_tagId" }, 400);

    const db = ctx({ DB: c.env.DB });
    const result = await deactivateTagDefinition(db, tagId);
    if (result === null) {
      return c.json({ ok: false, error: "tag_not_found" }, 404);
    }
    if (result.changed) {
      const authUser = c.get("authUser");
      await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
        actorId: asAdminId(authUser.memberId),
        actorEmail: adminEmail(authUser.email),
        action: auditAction("admin.tag.deactivated"),
        targetType: "tag",
        targetId: tagId,
        before: { active: true },
        after: { active: false },
      });
    }
    return c.body(null, 204);
  });

  return app;
};

export const adminTagsRoute = createAdminTagsRoute();
```

> **import 確認**: `auditAction` / `adminEmail` / `asAdminId` は `repository/_shared/brand` から（members.ts と同じ）。`requireProvider` は `repository/_shared/provider-context`（tags-queue.ts と同じ）。これらの実在パスは Phase 5 実装時に既存 import 文と突合する。

---

## 4. `apps/api/src/index.ts`（編集 / mount 順注意 — C-2）

import 追加（既存 `adminTagsQueueRoute` import の隣）:

```ts
import { adminTagsQueueRoute } from "./routes/admin/tags-queue";
import { adminTagsRoute } from "./routes/admin/tags"; // ← 追加
```

mount（現 276 行目 `app.route("/admin", adminTagsQueueRoute);` の **直後**に追加）:

```ts
app.route("/admin", adminTagsQueueRoute);
app.route("/admin", adminTagsRoute); // ← queue route の後に mount（C-2: /tags/queue 優先）
```

> **C-2（routing 衝突）**: `adminTagsQueueRoute` が `/tags/queue` を持ち、新 `adminTagsRoute` が `/tags`・`/tags/:tagId` を持つ。Hono は登録順にマッチを試みるため、`adminTagsQueueRoute` を **先に** mount することで `GET /tags/queue` が `GET /tags/:tagId`（`:tagId="queue"`）に飲まれない。Phase 6 で index 統合 regression（`/tags/queue` が従来 200）を検証する。

---

## 5. 実装注意（C-1..C-5 チェックリスト）

| 項目 | 実装上の注意 | 確認方法 |
|------|-------------|----------|
| **C-1** type-d gate 無風 | `tagDefinitions.ts` には readonly gate（`*.test-d.ts`）が無いため `create*`/`update*`/`deactivate*` を追加しても type-d FAIL しない。`memberTags.ts` には一切触れない | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`（または既存 type-d run）で gate 無風を確認 |
| **C-2** routing | queue route を tags route より先に mount | Phase 6 の index 統合 regression（`/tags/queue` → 200） |
| **C-3** code immutable | `UpdateTagBodyZ` に `code` を含めない（zod strip）。`updateTagDefinition` は label/category のみ SET | R-T11（PATCH に code を入れても無視） |
| **C-4** 論理削除 | `deactivateTagDefinition` は `tag_definitions.active=0` のみ。`member_tags` への DELETE/UPDATE を書かない | R-T12-mt / W-D4（member_tags 行保持） |
| **C-5** audit 冪等 | DELETE は `changed===true` のみ append。PATCH は before≠after のみ append | R-T14（既 inactive 再送で audit 増えない）/ W-D2 / Phase 6 no-op PATCH |

## 6. GREEN 確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- \
  src/routes/admin/tags.contract.spec.ts \
  src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  src/routes/admin/members.tags.contract.spec.ts \
  src/repository/__tests__/auditLog.repository.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

全件 PASS かつ typecheck / lint green を GREEN 完了条件とする。
