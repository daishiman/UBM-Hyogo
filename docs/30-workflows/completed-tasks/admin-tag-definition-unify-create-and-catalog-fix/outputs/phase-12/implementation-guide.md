# Implementation Guide

workflow_id: `admin-tag-definition-unify-create-and-catalog-fix`
taskId: `TASK-ADMIN-TAG-DEFINITION-UNIFY-CREATE-AND-CATALOG-FIX-001`

## Part 1 — 中学生レベル

お店の在庫を管理する係をイメージしてください。商品（タグ）を「新しく登録する」「名前を直す」「一時的に棚から下げる」「完全に捨てる」といった作業があります。

### なぜタグ作成の入口が必要なのか

今の管理画面には、**新しい商品を登録するボタンがどこにもありません**。名前を直す画面（タグ管理）はありますが、それは「すでに棚にある商品」しか扱えません。だから棚が空っぽのままで、係の人は新しい商品を一つも増やせず困ってしまいます。今回はこの「新規登録ボタン」をちゃんと付けます。実は裏側（注文を受け取る窓口＝API）はもう用意できているので、足りないのは「お客さんが押すボタンと入力欄」だけです。

### なぜカタログ画面が落ちたのか（防御の欠如）

注文票に「商品リスト」が一枚も挟まっていないのに、「リストの商品を上から順に数えて合計を出して」と言われたら、数える紙そのものが無いので作業が止まってしまいます。これがカタログ画面で起きた事故です。「商品リストが空かもしれない」という想定（防御）を入れず、いきなり数え始めたため、リストが無いときに画面ごと止まってしまいました。

直し方はかんたんです。**「リストが無ければ空のリストとして扱う」**という一言のルールを最初に入れるだけ。空っぽでも「商品は0件です」と落ち着いて表示できるようになります。今回は数える作業を専用の小さな部品にまとめ、その部品に必ず「整った（空でも空のリストになった）」状態だけが渡るようにして、同じ事故が二度と起きないようにします。

### なぜ画面を1つに統合するのか

今は「名前を直す画面」と「棚から下げる・捨てる画面」が**別々の部屋に分かれています**。しかも扱っている商品台帳は同じ一つなのに部屋が2つあるので、「どこで新しい商品を登録するの？」と迷子になります。これを**1つの「タグ定義管理」の部屋**にまとめ、「登録・名前直し・棚から下げる・棚に戻す・完全に捨てる」を全部その部屋でできるようにします。迷う原因（部屋の分裂）そのものを無くします。

| 用語 | 日常語での言い換え |
| --- | --- |
| タグ定義 | お店に登録された商品そのもの（台帳の1行） |
| カタログのクラッシュ | 商品リストが無いのに数え始めて作業が止まった事故 |
| 防御正規化 | 「リストが無ければ空リストとして扱う」最初の一言 |
| ライフサイクル | 棚に出す／下げる／戻す／捨てる、の状態の移り変わり |
| 統合 | 別々の部屋を1つにまとめること |
| リダイレクト | 古い部屋の入口を、新しい部屋へ自動で案内すること |

## Part 2 — Technical

> All identifiers below are quoted from real code / Phase 2-5 spec, not hand-written (W1-02b-3). API non-mutation is invariant #1.

### Core Types

統合パネルの正本型は既存 `tagCatalogLifecycle.ts` の `TagDefinitionItem` を再利用する（二重定義を作らない。Phase 3 §2 の型一本化決定）。

```ts
// apps/web/src/components/admin/tagCatalogLifecycle.ts:5 (existing — reuse)
export interface TagDefinitionItem {
  readonly tagId: string;
  readonly code: string;
  readonly label: string;
  readonly category: string;
  readonly active: boolean;
}
```

```ts
// apps/web/src/components/admin/tagDefinitionView.ts (new — defensive adapter, pure functions)
export interface TagDefinitionListView {
  readonly total: number;
  readonly items: TagDefinitionItem[];
}

export interface RawTagListResponse {
  readonly total?: unknown;
  readonly items?: unknown;
}

// items 欠落/null/非配列 → []、total 非数 → items.length。各 item を safe-coerce。
export function normalizeTagDefinitionList(
  raw: RawTagListResponse | null | undefined,
): TagDefinitionListView;

export function filterTagDefinitions(
  items: readonly TagDefinitionItem[],
  opts: { readonly query: string; readonly showInactive: boolean },
): TagDefinitionItem[];

// reduce はこの関数に閉じ込め、入力は常に正規化済み配列。クラッシュ class を根絶。
export function countTagDefinitions(
  items: readonly TagDefinitionItem[],
): { readonly active: number; readonly inactive: number; readonly total: number };
```

```ts
// apps/web/src/features/admin/api/tags.ts (new export, placed beside updateTag — naming parity FB-SDK-07-4)
export type AdminTagCreateInput = {
  readonly code: string;
  readonly label: string;
  readonly category: string;
};
export type AdminTagCreateErrorCode = "tag_code_conflict" | "invalid_body" | "invalid_json";
export class TagCreateError extends Error {
  readonly status: number;
  readonly code: AdminTagCreateErrorCode | null;
  readonly bodyText: string;
}
export async function createTag(input: AdminTagCreateInput): Promise<TagDefinitionItem>;
```

### API surface (existing only — no new endpoint)

| Operation | Method + path (proxy) | Backend (apps/api) | Source |
| --- | --- | --- | --- |
| list | `GET /api/admin/tags?page=1&pageSize=100` | `tags.ts:138-158` returns `{ total, items: result.items.map(rowBody) }` (`items` always an array) |裏取り済み |
| create | `POST /api/admin/tags` | `tags.ts:167-191`, body `CreateTagBodyZ`, returns `rowBody` 201 | 裏取り済み |
| edit | `PATCH /api/admin/tags/:id` | `tags.ts` (existing `updateTag`) | 裏取り済み |
| deactivate | `DELETE /api/admin/tags/:id` | `TAG_LIFECYCLE_DESCRIPTORS.deactivate` | 裏取り済み |
| reactivate | `POST /api/admin/tags/:id/reactivate` | `TAG_LIFECYCLE_DESCRIPTORS.reactivate` | 裏取り済み |
| physical-delete | `DELETE /api/admin/tags/:id/physical` | `TAG_LIFECYCLE_DESCRIPTORS["physical-delete"]` | 裏取り済み |

`rowBody` shape (`tags.ts:83-90`): `{ tagId, code, label, category, active }` — `active` を返すため web 側で `active` を含む型を採用すればよく、API 変更は不要。

### Validation contract

- API `CreateTagBodyZ` (`tags.ts:27-31`): `code` = `z.string().min(1).max(64).regex(CODE_RE)`, `label` = `min(1).max(120)`, `category` = `min(1).max(64)`.
- API `CODE_RE` (`tags.ts:25`): `/^[a-z0-9][a-z0-9_]*$/`.
- Client gate `TagDefinitionCreateForm` mirrors API with `CODE_PATTERN = /^[a-z0-9][a-z0-9_]{0,63}$/` (`max(64)` 整合) and non-empty `label`/`category`, blocking invalid input before send (AC-6).

### Error handling

| Trigger | API response | UI behaviour | Source |
| --- | --- | --- | --- |
| duplicate `code` (create) | 409 `tag_code_conflict` | `TagCreateError(code: "tag_code_conflict")` → inline `role="alert"`「同じコードのタグが既にあります。別のコードを指定してください。」; list intact (AC-5) | `tags.ts:177` `fail(c, "tag_code_conflict")` |
| physical-delete on in-use tag | 409 `tag_has_references` (`referenceCount`) | reuse `parseTagLifecycleError` → 「{n}人に使用中のため削除不可」 | `tagCatalogLifecycle.ts:102-113` |
| unauthenticated | 401 | `AuthRequiredError` (既存パターン踏襲) | `features/admin/api/tags.ts` updateTag 既存分岐 |
| invalid body / json | 400/422 `invalid_body` / `invalid_json` | client gate prevents; fallback generic message | `tags.ts:174-176` |

> `createTag` returns a `TagDefinitionItem` with `active: true` (作成直後は有効). `rowBody` always returns `active`; if absent in any edge, default `active: true`.

### Implementation order (Lane dependency)

1. **Lane A** (`tagDefinitionView.ts`): defensive `normalizeTagDefinitionList` / `filterTagDefinitions` / `countTagDefinitions`. Establishes the shape `TagDefinitionPanel` consumes. Precedes C.
2. **Lane B** (`features/admin/api/tags.ts` + `TagDefinitionCreateForm.tsx`): `createTag()` + create form. Independent of A.
3. **Lane C** (`TagDefinitionPanel.tsx` + `tag-master/page.tsx` + `tags/catalog/page.tsx` redirect + `shell-config.ts` nav + `globals.css`): integrates A+B + existing edit/lifecycle. Runs after A and B surfaces are fixed.

### State ownership (lock-variable safety)

`TagDefinitionPanel` owns `items` / `selectedId` / `mode` / `showInactive` / `searchText`. Mutation lock (`useAdminMutation` isLoading) releases via a single `finally` on success/failure/cancel (FB-STATE-DETAIL-003). Edit form re-syncs internal state on `useEffect([tag])` (FB STATE-DETAIL-03).

### Current-repo path corrections (drift guards)

- Routes live under `apps/web/app/(admin)/...`, **not** `apps/web/src/app/...`.
- `TagDefinitionItem` is reused from `tagCatalogLifecycle.ts`; `tagDefinitionView.ts` imports the type rather than redefining it.
- `shell-config.ts`: removing `tag-catalog` requires same-wave update of `ShellNavItemId` union + icon resolver + `shell-config.spec.ts` (Feedback 6, 3-point nav update).
- Old `TagCatalogPanel.tsx` / `TagMasterPanel.tsx` removal must be proven by `grep` live-import 0 (Phase 9, FB-UI-02-1); no `describe.skip` residue (FB-TASK-01/02).

## 視覚証跡

This workflow is `VISUAL_ON_EXECUTION`. Local implementation and tests are complete. Two local unauthenticated screenshots were captured for the admin auth boundary:

- `outputs/phase-11/screenshots/local-admin-tag-master.png`
- `outputs/phase-11/screenshots/local-admin-tags-catalog-redirect.png`

Authenticated admin UI screenshots are captured in a browser/staging visual pass after user approval. The required authenticated screen/state matrix is recorded in `outputs/phase-11/manual-test-result.md`.
