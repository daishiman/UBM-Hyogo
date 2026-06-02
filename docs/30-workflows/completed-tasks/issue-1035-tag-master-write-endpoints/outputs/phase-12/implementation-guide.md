# 実装ガイド — tag master (tag_definitions) write endpoints

**[実装区分: 実装仕様書]**

## Part 1: 概念説明（はじめての人向け）

### なぜ必要か（先に理由）

このサイトには「タグ」という仕組みがあります。たとえば会員さんに「エンジニア」「経営者」「飲食業」といった札（ふだ）を貼って、あとから探しやすくするためのものです。

この札の **種類の一覧表**（どんな札が存在するか）を、ここでは「タグ台帳（だいちょう）」と呼びます。いまのプログラムでは、この台帳は **読むことしかできません**。あらかじめ用意された札の種類しか使えず、あとから新しい種類の札を足したり、名前を直したり、もう使わない札を片づけたりできないのです。

そのため、管理者さんが「会員さんに貼りたい札が台帳に無い」と気づいても、自分では足せず、作業が途中で止まってしまいます。これを直すのが今回の目的です。

### 何をするか

管理者さんが **タグ台帳を自分で編集できる窓口**（ボタンの裏側の仕組み）を 4 つ用意します。日常の言葉でいうと、図書館の本のラベルを管理する係の人が使う 4 つの操作です。

- **一覧して探す**（GET）: 台帳にある札を、ページをめくりながら一覧したり、名前の一部で検索したりできます。
- **新しく作る**（POST）: 新しい種類の札を台帳に足します。すでに同じ「合言葉（code）」の札があると、間違って二重に作らないよう「もうあります」と教えてくれます。
- **名前を直す**（PATCH）: 札の「表示名（label）」や「分類（category）」を直せます。ただし **合言葉（code）だけは直せません**（後で説明します）。
- **片づける**（DELETE）: もう使わない札を台帳から「引っ込めます」。完全に消すのではなく、棚の奥にしまうイメージです。

### 大事な約束（こわさない）

1. **合言葉（code）は変えられない**: 札にはそれぞれ「合言葉」という変わらない名札がついていて、これを目印にして「どの会員にどの札を貼ったか」を覚えています。途中で合言葉を書き換えると、貼った記録との対応が分からなくなってしまうので、合言葉は **作ったときのまま固定** します。直せるのは見た目の名前（label）と分類（category）だけです。

2. **片づけても、貼った記録は消えない**: 札を片づけても、「すでにこの会員に貼った」という記録はそのまま残します。たとえるなら、文房具屋さんが「もうこのシールは売らない」と決めても、すでにノートに貼ってあるシールは剥がさない、という感じです。新しく貼ることはできなくなりますが、過去の貼り跡は残ります。

3. **やった操作は必ず記録する**: 作った・直した・片づけた、という操作は、誰がいつやったかを **作業日誌（audit）** に 1 行ずつ書き残します。ただし「すでに片づけた札をもう一度片づけてください」と言われたときは、何も変わらないので日誌には書きません（同じことを二重に書かない）。

### 今回やらないこと

- 管理画面の「ボタンそのもの（見た目）」は今回は作りません。裏側の窓口だけを用意します。見た目側は別の作業（別 Issue）にします。
- 合言葉そのものを付け替える機能、完全に消す機能、片づけた札を元に戻す機能も、今回は範囲外です（必要になったら別の作業にします）。

## Part 2: 技術詳細（開発者向け）

### 対象ファイル（Phase 1 inventory 準拠）

| # | パス | 変更種別 | 概要 |
| --- | --- | --- | --- |
| 1 | `apps/api/src/repository/tagDefinitions.ts` | 編集 | write 3 + read 2 関数追加、不変条件 #13 コメント改訂 |
| 2 | `apps/api/src/repository/auditLog.ts` | 編集 | `AuditTargetType` に `"tag"` 追加 |
| 3 | `apps/api/src/routes/admin/tags.ts` | 新規 | tag master CRUD route（GET/POST/PATCH/DELETE） |
| 4 | `apps/api/src/index.ts` | 編集 | `adminTagsRoute` import + mount |
| 5 | `docs/00-getting-started-manual/specs/01-api-schema.md` | 編集 | 不変条件 #13 に tag master CRUD（第3経路）節を追加 |

### repository 層に追加する型（`tagDefinitions.ts`）

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

### repository 層に追加する関数シグネチャ（`tagDefinitions.ts`）

```ts
// create: code UNIQUE 衝突は { ok:false, reason:"code_conflict" }。tag_id=crypto.randomUUID() / active=1 固定。
export async function createTagDefinition(
  c: DbCtx,
  input: CreateTagDefinitionInput,
): Promise<CreateTagDefinitionResult>;

// update: label/category のみ更新（code immutable）。不在=null。更新項目なしは現在行を no-op で返す。
export async function updateTagDefinition(
  c: DbCtx,
  tagId: string,
  input: UpdateTagDefinitionInput,
): Promise<TagDefinitionRow | null>;

// deactivate: active=0 へ論理削除。member_tags は触らない。
//   不在=null / 既に active=0={row, changed:false} / active=1→0={row, changed:true}。
export async function deactivateTagDefinition(
  c: DbCtx,
  tagId: string,
): Promise<{ row: TagDefinitionRow; changed: boolean } | null>;

// list: q（code/label 部分一致 LOWER LIKE）+ page(1始まり) + pageSize(上限つき)。inactive も含む。
export async function listTagDefinitionsPaged(
  c: DbCtx,
  opts: { q?: string; page: number; pageSize: number },
): Promise<PagedTagDefinitions>;

// id 取得（active フィルタ無し）。update/delete の存在確認用。
export async function getTagDefinitionByIdRaw(
  c: DbCtx,
  tagId: string,
): Promise<TagDefinitionRow | null>;
```

### SQL 実装方針（決定論的・Phase 2 §2.5 準拠）

| 関数 | SQL |
| --- | --- |
| `createTagDefinition` | `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active) VALUES (?1,?2,?3,?4,'[]',1)`。UNIQUE(code) 違反は `.run()` の throw を `try/catch` で捕捉し `/UNIQUE/i.test(message)` で `code_conflict` 写像（他 error は再 throw・レース安全） |
| `updateTagDefinition` | label/category の指定分のみ `SET` に含める動的 SQL。更新後 `getTagDefinitionByIdRaw` で再取得して返す |
| `deactivateTagDefinition` | まず `getTagDefinitionByIdRaw`。不在→null。`active===false`→`{row, changed:false}`。それ以外→`UPDATE ... SET active=0 WHERE tag_id=?1 AND active=1`、`meta.changes>0` を changed |
| `listTagDefinitionsPaged` | `WHERE (? IS NULL OR LOWER(code) LIKE ? OR LOWER(label) LIKE ?)`。count 用と LIMIT/OFFSET 用の 2 クエリ。q は `%<lower>%` に整形 |
| `getTagDefinitionByIdRaw` | `${SELECT_COLS} WHERE tag_id = ?1`（active フィルタ無し） |

### audit 型拡張（`auditLog.ts`）

`AuditTargetType` union に `"tag"` を追加。`AuditAction` は `RepoBrand<string>`（`_shared/brand.ts`）で enum 制約が無いため、`auditAction("admin.tag.created")` 等は **型変更不要**。

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

### API endpoint 仕様（`apps/api/src/routes/admin/tags.ts`）

route factory は `createAdminTagsRoute()` + `adminTagsRoute` instance を export（既存 `createAdminTagsQueueRoute` 構造に一致）。`requireAdmin` + `writeTagNoteProviderMiddleware`（auditLogProvider bind）を `app.use("*", ...)`。

| method / path | AC | 成功 | 主なエラー |
| --- | --- | --- | --- |
| `GET /tags` | AC-4 | `200 { total, items: TagDefinitionRow[] }`（inactive 含む） | `400 invalid_query`（`ListTagsQueryZ` safeParse 失敗） |
| `POST /tags` | AC-1 | `201 { tagId, code, label, category, active:true }` | `400 invalid_json` / `400 invalid_body` / `409 tag_code_conflict` |
| `PATCH /tags/:tagId` | AC-2 | `200 { tagId, code, label, category, active }` | `400 no_update_fields`（zod refine）/ `404 tag_not_found` |
| `DELETE /tags/:tagId` | AC-3 | `204 No Content`（`c.body(null, 204)`） | `404 tag_not_found` |

zod schema（route 内インライン）:

```ts
const CODE_RE = /^[a-z0-9][a-z0-9_]*$/;
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

error response 形式: `{ ok: false, error: "<code>" }` + status code（既存 admin route 慣例）。

### audit 記録パターン（AC-5・`members.ts:692-700` に一致）

state 変化時のみ 1 件 append（POST 作成 / PATCH で実値変化 / DELETE で `changed===true`）。

```ts
const authUser = c.get("authUser");
await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
  actorId: asAdminId(authUser.memberId),
  actorEmail: adminEmail(authUser.email),
  action: auditAction("admin.tag.created"),   // updated / deactivated も同形
  targetType: "tag",
  targetId: tagId,
  before: null,                                 // created は null / updated は変更前 / deactivated は {active:true}
  after: { code, label, category },             // updated は変更後 / deactivated は {active:false}
});
```

| action | 発火条件 | before | after |
| --- | --- | --- | --- |
| `admin.tag.created` | POST 成功 | `null` | `{ code, label, category }` |
| `admin.tag.updated` | PATCH で実値変化時のみ | `{ label, category }`（変更前） | `{ label, category }`（変更後） |
| `admin.tag.deactivated` | DELETE で `changed===true` のみ | `{ active: true }` | `{ active: false }` |

### index.ts mount（routing 衝突注意・Phase 2 §5 / Phase 3 C-2）

`adminTagsQueueRoute`（`/tags/queue`）が `adminTagsRoute`（`/tags/:tagId`）に飲み込まれないよう、**`adminTagsQueueRoute` を先に mount** する。Phase 4 で `/tags/queue` の regression（従来通り 200）を必須化。

```ts
import { adminTagsRoute } from "./routes/admin/tags";   // import 追加
app.route("/admin", adminTagsRoute);                    // adminTagsQueueRoute の後に追加
```

### 識別子一覧（実装時 grep 確認対象・phase-2 設計と一致）

- `createTagDefinition` / `updateTagDefinition` / `deactivateTagDefinition` / `listTagDefinitionsPaged` / `getTagDefinitionByIdRaw`（`tagDefinitions.ts`）
- `CreateTagDefinitionInput` / `UpdateTagDefinitionInput` / `CreateTagDefinitionResult` / `PagedTagDefinitions`（型）
- `createAdminTagsRoute` / `adminTagsRoute`（`tags.ts`）
- `AuditTargetType` の `"tag"`（`auditLog.ts`）
- audit action 文字列: `admin.tag.created` / `admin.tag.updated` / `admin.tag.deactivated`
- error code: `tag_code_conflict` / `tag_not_found` / `invalid_query` / `invalid_json` / `invalid_body` / `no_update_fields`

## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は `outputs/phase-11/manual-test-result.md`（NON_VISUAL 宣言 + focused D1 Vitest / typecheck / lint の実測 PASS）および Phase 4 のテストケース設計（`outputs/phase-4/phase-4.md`）。
