# Phase 2: 設計

> 実装が確実に行えるよう、対象モジュール・関数シグネチャ・データ構造・入出力・副作用・エラーハンドリングを確定する。後続実装者はこの章をコントラクトとして実装する。

## 0. 既存コンポーネント再利用可否（FB-SDK-07-1）

新規 UI 実装はゼロ。以下を **再利用**する（新規 primitive/helper を増やさない）:

- D1 アクセス: `ctx({ DB: c.env.DB })` → `DbCtx`（`repository/_shared/db.ts`）
- audit: `requireProvider(c.var.auditLogProvider, "auditLogProvider").append({...})`（`writeTagNoteProviderMiddleware` が bind）
- admin guard: `requireAdmin` middleware
- 認証: `c.get("authUser")` → `{ memberId, email }`、`asAdminId` / `adminEmail` brand 変換
- ID 生成: `crypto.randomUUID()`（`auditLog.append` と同一）
- pagination parse: `members.ts` の `parseSearchOrError` の page 検証ロジックを踏襲（独自 util は作らない・本 route 内インライン）

## 1. トポロジ（レイヤ構造）

```
HTTP  →  apps/api/src/routes/admin/tags.ts   (Hono route / zod validation / audit / error mapping)
            │
            ▼
         apps/api/src/repository/tagDefinitions.ts   (D1 write/read 関数 — 状態所有権はここ)
            │
            ▼
         D1: tag_definitions テーブル (migration 0002 / active カラム既存)
```

- **状態所有権**: `tag_definitions` の write は `tagDefinitions.ts` が唯一の出口。route は SQL を書かない。
- **use-case 層なし**: 既存 admin route（members.ts）と同じく route → repository 直結。

## 2. repository 層: `apps/api/src/repository/tagDefinitions.ts`（編集）

### 2.1 既存（変更しない read 関数）

`listAllTagDefinitions` / `listByCategory` / `findByCode` はそのまま。`SELECT_COLS` / `map` / `TagDefinitionRow` / `DbRow` を再利用。

### 2.2 不変条件 #13 コメント改訂（48 行目）

```ts
// 不変条件 #13（2026-06 再々定義 / issue-1035）:
//   tag master (tag_definitions) の write は「管理者による tag master CRUD」経路として
//   本ファイルの createTagDefinition / updateTagDefinition / deactivateTagDefinition のみ許可する。
//   いずれも admin 専用 route (/admin/tags) から audit (admin.tag.created/updated/deactivated)
//   付きで呼ぶこと。code は immutable（UPDATE 対象は label/category のみ）。論理削除は active=0
//   とし、member_tags の既存 row は保持する。それ以外の write 経路を生やす場合は不変条件 #13
//   自体の変更レビューを経ること。
```

### 2.3 追加する型

```ts
// 既存 TagDefinitionRow を再利用（tagId/code/label/category/sourceStableKeysJson/active）

export interface CreateTagDefinitionInput {
  code: string;
  label: string;
  category: string;
}

export interface UpdateTagDefinitionInput {
  label?: string;
  category?: string;
}

// create の結果。code 衝突は呼び出し側で 409 に写像する。
export type CreateTagDefinitionResult =
  | { ok: true; row: TagDefinitionRow }
  | { ok: false; reason: "code_conflict" };

export interface PagedTagDefinitions {
  total: number;
  items: TagDefinitionRow[];
}
```

### 2.4 追加する write/read 関数シグネチャ

```ts
/**
 * tag master を新規作成する。code は UNIQUE。衝突時は { ok:false, reason:"code_conflict" }。
 * tag_id は crypto.randomUUID()。active=1 / source_stable_keys_json='[]' 固定。
 * 副作用: tag_definitions に 1 行 INSERT。
 */
export async function createTagDefinition(
  c: DbCtx,
  input: CreateTagDefinitionInput,
): Promise<CreateTagDefinitionResult>;

/**
 * tag master の label / category を更新する（code は immutable）。
 * 対象 tag_id が存在しなければ null。両フィールド undefined（更新項目なし）の場合も
 * 現在行をそのまま返す（no-op）。active 状態は変更しない。
 * 副作用: 該当行があれば UPDATE。
 */
export async function updateTagDefinition(
  c: DbCtx,
  tagId: string,
  input: UpdateTagDefinitionInput,
): Promise<TagDefinitionRow | null>;

/**
 * tag master を論理削除する（active=0）。member_tags は触らない。
 * 戻り値: 対象不在=null / 既に active=0=既存値 row（changed=false）/ active=1→0 にした=更新後 row（changed=true）。
 * 冪等性のため { row, changed } を返し、route は changed 時のみ audit する。
 * 副作用: active=1 の行のみ UPDATE active=0。
 */
export async function deactivateTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<{ row: TagDefinitionRow; changed: boolean } | null>;

/**
 * tag master を pagination + search で一覧。q は code/label の部分一致（LIKE, 大小無視は LOWER）。
 * inactive も含めて返す（master 管理ビュー）。total はフィルタ適用後の総件数。
 * page は 1 始まり、pageSize は上限つき。
 */
export async function listTagDefinitionsPaged(
  c: DbCtx,
  opts: { q?: string; page: number; pageSize: number },
): Promise<PagedTagDefinitions>;

/**
 * tag_id で 1 件取得（active フィルタ無し = inactive も検出）。update/delete の存在確認用。
 * 既存 findByCode は code 用なので id 版を別途追加する。
 */
export async function getTagDefinitionByIdRaw(
  c: DbCtx,
  tagId: string,
): Promise<TagDefinitionRow | null>;
```

### 2.5 SQL 実装方針（決定論的）

| 関数 | SQL |
|------|-----|
| `createTagDefinition` | `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active) VALUES (?1,?2,?3,?4,'[]',1)`。UNIQUE(code) 衝突は `.run()` の throw を catch し `/UNIQUE/i.test(message)` で `code_conflict` 判定（事前 `findByCode` チェックも併用可だが、最終的に catch でレース安全に） |
| `updateTagDefinition` | label/category の指定分のみ `SET` に含める動的 SQL。更新後 `getTagDefinitionByIdRaw` で再取得して返す |
| `deactivateTagDefinition` | まず `getTagDefinitionByIdRaw`。不在→null。`active===false`→`{row, changed:false}`。それ以外→`UPDATE tag_definitions SET active=0 WHERE tag_id=?1 AND active=1`、`meta.changes>0` を changed として更新後 row を返す |
| `listTagDefinitionsPaged` | `WHERE (? IS NULL OR LOWER(code) LIKE ? OR LOWER(label) LIKE ?)`。count 用と LIMIT/OFFSET 用の 2 クエリ。q は `%<lower>%` に整形 |
| `getTagDefinitionByIdRaw` | `${SELECT_COLS} WHERE tag_id = ?1`（active フィルタ無し） |

> **code conflict 検出**: SQLite の UNIQUE 制約違反は `c.db.prepare(...).run()` が reject する。`try/catch` で捕捉し、メッセージに `UNIQUE` を含む場合のみ `code_conflict` に写像（他の DB error は再 throw）。レース時も事後 catch で確実に 409 化できる。

## 3. audit 型拡張: `apps/api/src/repository/auditLog.ts`（編集）

`AuditTargetType` union（8-14 行目）に `"tag"` を追加:

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

`AuditAction` は `RepoBrand<string>`（`_shared/brand.ts:27`）で enum 制約が無いため、`auditAction("admin.tag.created")` 等は **型変更不要**。

## 4. route 層: `apps/api/src/routes/admin/tags.ts`（新規）

### 4.1 zod schema（route 内インライン）

```ts
const CODE_RE = /^[a-z0-9][a-z0-9_]*$/;            // member tags の既存 code 慣例（biz_food 等）
const CreateTagBodyZ = z.object({
  code: z.string().min(1).max(64).regex(CODE_RE),
  label: z.string().min(1).max(120),
  category: z.string().min(1).max(64),
});
const UpdateTagBodyZ = z
  .object({ label: z.string().min(1).max(120).optional(), category: z.string().min(1).max(64).optional() })
  .refine((b) => b.label !== undefined || b.category !== undefined, { message: "no_update_fields" });
const ListTagsQueryZ = z.object({
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
```

### 4.2 route factory（既存 `createAdminTagsQueueRoute` 構造に一致）

```ts
export const createAdminTagsRoute = () => {
  const app = new Hono<{
    Bindings: AdminRouteEnv;
    Variables: RequireAuthVariables & Partial<WriteTagNoteProviderVariables>;
  }>();
  app.use("*", requireAdmin);
  app.use("*", writeTagNoteProviderMiddleware);  // auditLogProvider を bind
  // ... 4 endpoints ...
  return app;
};
export const adminTagsRoute = createAdminTagsRoute();
```

### 4.3 endpoint 仕様（入出力・副作用・エラー）

#### GET `/tags` — 一覧（AC-4）

| 項目 | 内容 |
|------|------|
| query | `q?`, `page?`(default 1), `pageSize?`(default 50, max 100)。`ListTagsQueryZ.safeParse` 失敗 → 400 `invalid_query` |
| 成功 | `200 { total: number, items: TagDefinitionRow[] }`（inactive 含む） |
| 副作用 | なし |

#### POST `/tags` — 作成（AC-1）

| 項目 | 内容 |
|------|------|
| body | `{ code, label, category }`。JSON parse 失敗 → 400 `invalid_json`。`CreateTagBodyZ` 失敗 → 400 `invalid_body` |
| 成功 | `201 { tagId, code, label, category, active: true }`（作成 row） |
| 衝突 | `createTagDefinition` が `code_conflict` → `409 { ok:false, error:"tag_code_conflict" }` |
| audit | `admin.tag.created` / targetType `tag` / targetId=新 tagId / before=null / after={code,label,category} |
| 副作用 | INSERT 1 行 + audit 1 行 |

#### PATCH `/tags/:tagId` — 更新（AC-2）

| 項目 | 内容 |
|------|------|
| body | `{ label?, category? }`。両方未指定 → 400 `no_update_fields`（zod refine）。parse 失敗 → 400 |
| 不在 | `updateTagDefinition` が null → `404 { ok:false, error:"tag_not_found" }`（事前 `getTagDefinitionByIdRaw` で存在確認 → 不在は 404） |
| 成功 | `200 { tagId, code, label, category, active }`（更新後 row） |
| audit | `admin.tag.updated` / before={変更前 label,category} / after={変更後}。実値が変化した時のみ append |
| 副作用 | UPDATE + audit |

#### DELETE `/tags/:tagId` — 論理削除（AC-3）

| 項目 | 内容 |
|------|------|
| 不在 | `deactivateTagDefinition` が null → `404 { ok:false, error:"tag_not_found" }` |
| 成功 | `204 No Content`（`c.body(null, 204)`） |
| audit | `admin.tag.deactivated` / before={active:true} / after={active:false}。`changed===true` の時のみ append（既に inactive の冪等再送では audit を増やさない・204） |
| 副作用 | `active=1→0` の UPDATE（changed 時）+ audit |

### 4.4 audit 呼び出しパターン（members.ts:692-700 に一致）

```ts
const authUser = c.get("authUser");
await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
  actorId: asAdminId(authUser.memberId),
  actorEmail: adminEmail(authUser.email),
  action: auditAction("admin.tag.created"),
  targetType: "tag",
  targetId: tagId,
  before: null,
  after: { code, label, category },
});
```

## 5. index.ts mount: `apps/api/src/index.ts`（編集）

```ts
import { adminTagsRoute } from "./routes/admin/tags";   // import 追加
// ... admin route 群の中（adminTagsQueueRoute の隣など）に追加
app.route("/admin", adminTagsRoute);
```

> **path 衝突注意**: `adminTagsQueueRoute` は `/tags/queue` を扱う。新 route の `GET /tags` と Hono の routing 上の優先順位を確認すること（より具体的な `/tags/queue` が先にマッチするよう、`adminTagsQueueRoute` を `adminTagsRoute` より **先に** mount するか、Hono の最長一致に依存。Phase 4 で `/tags/queue` の regression test を確認）。

## 6. 正本 spec 更新: `docs/00-getting-started-manual/specs/01-api-schema.md`（編集 / Phase 12 Step 2）

不変条件 #13 セクションに「3. 管理者による tag master (tag_definitions) の CRUD」節 + endpoints テーブル + audit action テーブルを追加（詳細は [Phase 12 system-spec-update-summary](../phase-12/system-spec-update-summary.md)）。

## 7. ロック変数 / 状態所有権 / 因果ループ

- **状態所有権**: `active` フラグの所有は `tag_definitions`。`member_tags` は assignment の所有のみで、tag master の active には介入しない。
- **バランスループ**: deactivate → available 一覧から消える（`td.active=1` JOIN フィルタ）→ 新規付与不可 → ただし既存 assignment は残存（表示と実データの乖離を AC-3 で許容）。
- **強化ループ**: create → master 増加 → available 一覧に出る → member へ付与可能。

## 8. ステップ間 state 引き渡し（該当なし）

multi-step wizard ではない単一 API 群のため state 引き渡しテーブルは N/A。

## 9. ライブラリ選定

新規ライブラリ追加なし（zod / hono / D1 既存のみ）。
