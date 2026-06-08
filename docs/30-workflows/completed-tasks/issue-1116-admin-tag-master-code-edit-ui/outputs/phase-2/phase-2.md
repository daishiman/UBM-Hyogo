# Phase 2: 設計（issue-1116 admin tag master code edit UI）

> 親タスク `issue-1069-tag-code-rename` で完成した API surface（`PATCH /admin/tags/:tagId` の `code`/`expectedCode`・409 `tag_code_conflict` / `tag_stale_conflict` 分離）を、`apps/web` の新規 admin UI から消費する設計。`apps/api` は一切変更しない（不変条件 #1 / #7）。

## 2.1 ADR: tag master 編集 UI のルート配置

### 結論

**sibling ルート `apps/web/app/(admin)/admin/tag-master/page.tsx` を新設する。`/admin/tags` の子ルート（`/admin/tags/master` 等）にはしない。**

### 子ルート禁止の根拠（nav prefix 衝突バグ）

`isNavItemActive`（`apps/web/src/components/shell/shell-config.ts:125-129`）の active 判定は次の通り:

```ts
export function isNavItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/") return pathname === "/";
  if (itemHref === "/admin") return pathname === "/admin";
  return pathname === itemHref || pathname.startsWith(itemHref + "/");
}
```

`/admin/tags` は tag QUEUE nav item（`shell-config.ts:82` = `{ id: "tag-queue", href: "/admin/tags", label: "タグキュー", icon: "tag-queue" }`）で占有済みである。仮に master CRUD を `/admin/tags/master` 等の子ルートに置くと、`pathname.startsWith("/admin/tags" + "/")` が `true` になり、master ページ滞在中に **`tag-queue` nav item が同時 active になる nav 衝突バグ**が発生する。

sibling ルート `/admin/tag-master` であれば `isNavItemActive("/admin/tags", "/admin/tag-master")` は `pathname.startsWith("/admin/tags/")` も `pathname === "/admin/tags"` も `false` で衝突しない。これを regression test（`shell-config.spec.ts` / `SidebarNavItem.spec.tsx`）で固定する。

### 代替案（却下）

| 代替案 | 内容 | 却下理由 |
| --- | --- | --- |
| `/admin/tags/master` 子ルート | tag-queue 配下に master を置く | 上記 nav prefix 衝突。`isNavItemActive` の改修（QUEUE 側を完全一致化）は他 admin nav の active 規則と不整合になり波及大 |
| 既存 `/admin/tags` を master へ転用 | QUEUE を別 path へ移し master を `/admin/tags` に置く | 既存 QUEUE route・nav・テスト・blueprint への破壊が過大。本 issue 範囲を超える |
| `/admin/schema` 等への相乗り | 既存 admin ページに編集セクションを追加 | tag master 編集は独立した責務。schema 画面の責務と混線し SRP を破る |

→ **sibling `/admin/tag-master`** を採用する（nav id `tag-master`・label「タグ管理」・icon `tag-master`）。

## 2.2 既存コンポーネント再利用可否

新規モジュールを最小化し、既存 surface を最大限再利用する（不変条件 #3 = 新規 primitive を生やさない）。

| 既存資産 | 再利用方針 | 根拠 |
| --- | --- | --- |
| `safeServerFetch<T>`（`apps/web/src/lib/admin/safe-server-fetch.ts:6-26`） | server component で `/admin/tags?page=1&pageSize=50` を取得し `SafeResult<T>` を分岐 | `/admin/tags/page.tsx:42` と同一パターン |
| `AdminPageHeader`（`_layout/AdminPageHeader.tsx:14-48`） | eyebrow / title / description / breadcrumbs を渡す | `/admin/tags/page.tsx:61-66` と同一 |
| `AdminSectionErrorClient`（`features/admin/components/_shared`） | `safeServerFetch` 失敗時の error 表示 | `/admin/tags/page.tsx:81-85` と同一 |
| `FormField`（`components/ui/FormField.tsx:19`） | code/label/category 入力（不変条件 #9） | `MemberTagInlineCreate.tsx:227-271` と同一 |
| `Input` / `Button`（`components/ui/`） | フォーム入力子・送信/キャンセルボタン | `MemberTagInlineCreate.tsx` と同一 |
| `useAdminMutation`（`features/admin/hooks/useAdminMutation.ts:132-136`） | PATCH 発火（method `"PATCH"` overload・retry 不可・不変条件 #10） | `MemberTagInlineCreate.tsx:84` の POST 用法に倣う |
| `FetchAuthedError`（同 hook re-export `useAdminMutation.ts:67`） | catch した error から `bodyText` を取り出し error code を parse | `MemberTagInlineCreate.tsx:135-138` と同一 |
| `AdminTagRef` 型（`features/admin/api/members.ts:6-11`） | 一覧 row / 編集対象の型として import 再利用（再定義しない） | `members.ts` 既存 export |
| catch-all proxy（`app/api/admin/[...path]/route.ts:125` `export const PATCH = proxy`） | `PATCH /api/admin/tags/:tagId` 転送。新規 proxy route 不要 | 既存で PATCH method を export 済み |

> read 用の `fetchTagMaster`（`members.ts:121-134`）は bulk picker 専用に `{ available, total }` へ正規化している。本 UI は server component で `safeServerFetch` を直接使い API の `{ total, items }` を素直に受けるため、`fetchTagMaster` は使わない（client fetch 経路を増やさない）。

## 2.3 web API client シグネチャ設計

新規ファイル `apps/web/src/features/admin/api/tags.ts`（`members.ts` の `createTag` / `parseTagErrorCode` / `TagCreateError` パターンを踏襲）。

```ts
import type { AdminTagRef } from "./members"; // 型再利用（再定義しない）

/** PATCH /admin/tags/:tagId に渡す更新フィールド。すべて optional だが UI は最低 1 つ送る。 */
export type AdminTagUpdateInput = {
  code?: string;
  label?: string;
  category?: string;
  /** code 指定時のみ必須。行ロード時の code を CAS token として送る。 */
  expectedCode?: string;
};

/** PATCH /admin/tags/:tagId の API が fail(c, code) で返す既知 error code（ERROR_TO_STATUS のサブセット）。 */
export type AdminTagUpdateErrorCode =
  | "tag_code_conflict"   // 409: UNIQUE(code) 衝突
  | "tag_stale_conflict"  // 409: expectedCode mismatch（optimistic CAS）
  | "tag_not_found"       // 404
  | "no_update_fields"    // 400: 更新フィールド未指定
  | "invalid_body"        // 400: body 形式不正（expected_code_required 含む）
  | "invalid_json";       // 400: JSON parse 失敗

/** updateTag が !res.ok 時に throw する error。検出 code（不明なら null）・HTTP status・raw body を載せる。 */
export class TagUpdateError extends Error {
  readonly status: number;
  readonly code: AdminTagUpdateErrorCode | null;
  readonly bodyText: string;
  constructor(status: number, code: AdminTagUpdateErrorCode | null, bodyText: string);
}

/**
 * error body（{ ok:false, error:"<code>" } の JSON 文字列）から既知 update error code を取り出す。
 * 不正 JSON / 未知 code / error 欠落 / 非オブジェクトは null（members.ts:parseTagErrorCode と同一構造）。
 */
export function parseTagUpdateErrorCode(body: string): AdminTagUpdateErrorCode | null;

/**
 * PATCH /api/admin/tags/:tagId の raw helper（fetch 直叩き・非 hook 再利用 / テスト向け）。
 * 200 で AdminTagRef を返す（API rowBody = { tagId, code, label, category, active } から active を除いた 4 項目）。
 * !res.ok 時は parseTagUpdateErrorCode で検出した code を載せた TagUpdateError を throw（code が null=不明でも throw）。
 */
export async function updateTag(
  tagId: string,
  input: AdminTagUpdateInput,
): Promise<AdminTagRef>;
```

### `updateTag` の実装契約

| 項目 | 値 |
| --- | --- |
| エンドポイント | `` `/api/admin/tags/${encodeURIComponent(tagId)}` ``（catch-all proxy 経由・新規 proxy 不要） |
| method | `PATCH` |
| headers | `{ "content-type": "application/json" }` |
| credentials | `"same-origin"` |
| body | `JSON.stringify(input)`（`code` 未指定なら `expectedCode` を含めない = 後方互換） |
| 成功（200） | `await res.json()` を `AdminTagRef & { active?: boolean }` と見なし `{ tagId, code, label, category }` の 4 項目に絞って返す（`members.ts:createTag:259-265` と同一の絞り込み） |
| 失敗（!res.ok） | `bodyText = await res.text().catch(() => "")` → `throw new TagUpdateError(res.status, parseTagUpdateErrorCode(bodyText), bodyText)` |

> `KNOWN_TAG_UPDATE_ERROR_CODES: readonly AdminTagUpdateErrorCode[]` を module 内に定義し `parseTagUpdateErrorCode` で `.includes` 判定する（`members.ts:200-204` の `KNOWN_TAG_CREATE_ERROR_CODES` と同一構造）。

> API は `code` 指定時 `expectedCode` 未指定だと zod refine（`tags.ts:41-44` `expected_code_required`）で safeParse 失敗 → route が `invalid_body`（`tags.ts:192,209`）を返す。よって UI 側で「code 変更時は expectedCode を必ず同梱」を担保する（§2.5）。`no_update_fields`（`tags.ts:38-40,189-192`）も同様に UI 側で「最低 1 フィールド変更」を担保する。

## 2.4 client component シグネチャ設計

### 2.4.1 `TagMasterPanel.tsx`（一覧 + 行選択 + optimistic 反映）

新規 `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx`（`"use client"`）。`TagQueuePanel.tsx` の「左 list + 右 pane」構造を踏襲する。

```ts
import type { AdminTagRef } from "../../api/members";

export interface TagMasterPanelProps {
  /** server component が safeServerFetch で取得した tag master 一覧。 */
  readonly initial: ReadonlyArray<AdminTagRef>;
  /** API が返した総件数（pageSize=50 を超える場合のヒント表示用）。 */
  readonly total: number;
}

export function TagMasterPanel(props: TagMasterPanelProps): ReactElement;
```

状態:

| state | 型 | 役割 |
| --- | --- | --- |
| `rows` | `AdminTagRef[]`（`useState(() => [...initial])`） | 表示中の一覧。保存成功時に該当 row を optimistic 置換する（rename 後も旧 code を残さない） |
| `selectedTagId` | `string \| null` | 選択中の行（編集フォーム表示対象） |

挙動:

- 一覧テーブル（または list）を `rows` から描画。各行は `tagId` を key とし、`code` / `label` / `category` を表示。
- 行クリックで `setSelectedTagId(row.tagId)` → 右ペインに `TagMasterEditForm` を表示（選択行を `row` props で渡す）。
- `TagMasterEditForm` の `onSaved(updated: AdminTagRef)` で `rows` 内の `tagId` 一致 row を `updated` に差し替え（`rows.map(r => r.tagId === updated.tagId ? updated : r)`）、選択は維持。
- `onCancel()` で `setSelectedTagId(null)`。
- 一覧が空のときは `EmptyState`（`components/ui` 既存）で「タグがありません」を表示。

data-testid 命名（`TagQueuePanel` の `admin-tag-queue-list` / `admin-tag-review-panel` 規則に整合）:

| 要素 | data-testid |
| --- | --- |
| 一覧 list / table | `admin-tag-master-list` |
| 各行（選択ボタン） | `admin-tag-master-row`（`data-tag-id={row.tagId}` を併記して特定可能にする） |
| 編集ペイン | `admin-tag-master-edit-panel` |

### 2.4.2 `TagMasterEditForm.tsx`（編集フォーム + expectedCode 保持 + 409 分離表示）

新規 `apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx`（`"use client"`）。`MemberTagInlineCreate.tsx` のフォーム/状態機械/error parse を踏襲する。

```ts
import type { AdminTagRef } from "../../api/members";

export interface TagMasterEditFormProps {
  /** 編集対象の行。マウント時点の row.code を expectedCode の初期値として固定する。 */
  readonly row: AdminTagRef;
  /** 200 成功時に呼ぶ。親（Panel）は rows を optimistic 置換する。 */
  readonly onSaved: (updated: AdminTagRef) => void;
  /** キャンセル時に呼ぶ。親は選択解除する。 */
  readonly onCancel: () => void;
}

export function TagMasterEditForm(props: TagMasterEditFormProps): ReactElement;
```

状態:

| state | 型 | 役割 |
| --- | --- | --- |
| `code` / `label` / `category` | `string`（初期値 = `row.code` / `row.label` / `row.category`） | 編集中の入力値 |
| `expectedCodeRef` | `useRef(row.code)` | マウント時点の code を CAS token として固定保持。submit 時に「code を変更した場合のみ」同梱する。`row` の prop が再選択で変わるケースは Panel 側で `key={row.tagId}` を付け再マウントさせ ref を初期化する |
| `fieldErrors` | `{ code?; label?; category? }` | client validation（`MemberTagInlineCreate.validateTagFields` と同一規則）の表示 |
| `conflictKind` | `"code" \| "stale" \| null` | 409 の種別（分離表示用） |
| `formError` | `string \| null` | 400 / network 等の包括 error |

mutation:

```ts
const update = useAdminMutation<AdminTagRef>(
  `/api/admin/tags/${encodeURIComponent(row.tagId)}`,
  "PATCH",
  { refreshOnSuccess: false, successMessage: "✓ タグを更新しました" },
);
```

submit ロジック（後方互換 = §2.5）:

1. trim した `code` / `label` / `category` を client validation（空・長さ・`CODE_RE`）。NG なら `fieldErrors` を表示し発火しない。
2. **変更フィールドだけ**を payload に組む:
   - `code !== row.code` のとき `payload.code = code` かつ `payload.expectedCode = expectedCodeRef.current`。
   - `label !== row.label` のとき `payload.label = label`。
   - `category !== row.category` のとき `payload.category = category`。
3. 変更フィールドが 0 件なら発火せず `formError`「変更がありません」を表示（API `no_update_fields` を UI 側でも先回り防御・AC-4）。
4. `await update.trigger(payload)`。
   - 成功（200）→ `onSaved(updated)`（`updated` = API が返した最新 row。code rename 後の新 code を含む）。
   - catch → `bodyText = err instanceof FetchAuthedError ? err.bodyText : (err as { bodyText?: string })?.bodyText ?? ""` → `parseTagUpdateErrorCode(bodyText)`:
     - `"tag_code_conflict"` → `setConflictKind("code")`。
     - `"tag_stale_conflict"` → `setConflictKind("stale")`。
     - `"invalid_body"` / `"no_update_fields"` / `"invalid_json"` → `setFormError("入力内容を確認してください…")`。
     - その他 / null → `setFormError("タグの更新に失敗しました。時間をおいて再度お試しください")`。

409 分離表示（AC-3）— `conflictKind` で文言を分ける:

| `conflictKind` | 表示文言（`role="alert"`） | 回復導線 |
| --- | --- | --- |
| `"code"`（`tag_code_conflict`） | 「コード『{code}』は既に使われています。別のコードを入力してください。」 | フォームに留まり code 再入力 |
| `"stale"`（`tag_stale_conflict`） | 「保存前に別の変更が入りました。画面を更新して最新のコードを確認してください。」 | code conflict と別文言で表示し、古い入力のまま上書きしないよう手動更新を促す |

data-testid:

| 要素 | data-testid |
| --- | --- |
| フォーム | `admin-tag-master-edit-form` |
| code conflict 表示 | `admin-tag-master-conflict-code` |
| stale conflict 表示 | `admin-tag-master-conflict-stale` |

> input 要素は **必ず `FormField` 経由**（不変条件 #9）。`apps/web/src/components/admin/` 配下に直接 `<input>` を増やさない。色は `var(--ubm-color-*)` OKLch token のみ（不変条件 #2・`MemberTagInlineCreate.tsx:158,179,195,223` の token 用法に整合）。

### 2.4.3 `page.tsx`（server component）

新規 `apps/web/app/(admin)/admin/tag-master/page.tsx`。`/admin/tags/page.tsx` と同一構造。

```ts
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { AdminPageHeader } from "../../../../src/features/admin/components/_layout/AdminPageHeader";
import { AdminSectionErrorClient } from "../../../../src/features/admin/components/_shared";
import { TagMasterPanel } from "../../../../src/features/admin/components/_tags/TagMasterPanel";
import type { AdminTagRef } from "../../../../src/features/admin/api/members";

interface TagMasterListView {
  total: number;
  items: AdminTagRef[];
}

export const dynamic = "force-dynamic";

export default async function AdminTagMasterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp["q"]?.trim();
  const qs = q ? `&q=${encodeURIComponent(q)}` : "";
  const result = await safeServerFetch<TagMasterListView>(
    `/admin/tags?page=1&pageSize=50${qs}`,
  );

  return (
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="ADMIN / TAG MASTER"
        title="タグ管理"
        description="タグの code / 表示名 / カテゴリを編集します。"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "タグ管理" }]}
      />
      {result.ok ? (
        <TagMasterPanel initial={result.data.items} total={result.data.total} />
      ) : (
        <AdminSectionErrorClient
          sectionLabel="タグ管理"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </section>
  );
}
```

> API `GET /admin/tags` は `ListTagsQueryZ`（`tags.ts:46-50`）で `q` / `page` / `pageSize`（max 100）を受け、`{ total, items }`（`tags.ts:148-151`・items は `rowBody` = `{ tagId, code, label, category, active }`）を返す。本 UI は `pageSize=50` 固定で 1 ページ目を取得し、`total > items.length` のとき Panel で「先頭 50 件を表示」のヒントを出す（ページネーション拡張は別スコープ）。`q` は searchParams 経由で透過し、将来の検索 UI を阻害しない。

### 2.4.4 nav 配線

`apps/web/src/components/shell/shell-config.ts`:

- `ShellNavItemId` union（`shell-config.ts:9-23`）に **`"tag-master"`** を追加（`"tag-queue"` の直後に並べる）。
- `buildAdminGroup` の `items`（`shell-config.ts:73-100`）で **`tag-queue` item（:82）の直後**に挿入:
  ```ts
  { id: "tag-master", href: "/admin/tag-master", label: "タグ管理", icon: "tag-master" },
  ```
  → 「タグキュー」（提案レビュー）と「タグ管理」（master 編集）が隣接し責務差が明示される（DESIGN-BRIEF §6 リスク対策）。

`apps/web/src/components/shell/icons.tsx`:

- `PATHS: Record<ShellNavItemId, string>`（`icons.tsx:25-44`）に **`"tag-master"`** キーを追加。`ShellNavItemId` に列挙を足すと `Record` の網羅性により未追加だと型エラーになるため、必ず同時に追加する。
- viewBox は既存の `0 0 24 24`・`fill="none"` / `stroke="currentColor"` の Stroke コンポーネント前提（`icons.tsx:7-23`）。編集（ペン）系の path 文字列を提案する:
  ```ts
  "tag-master": "M11 4H4v16h16v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
  ```
  （左の矩形 = タグ/カードの輪郭、右のペン = 編集を示唆。`tag-queue` の「タグ + drop」path と視覚的に区別できる。実装時に他 icon との視認性を確認し微調整可。）

## 2.5 expectedCode CAS 配線設計（compare-and-swap）

- 編集フォームは **マウント時点の `row.code` を `expectedCodeRef` に固定**する。これが「admin が今見ている code」= optimistic ロック token。
- submit 時、**code を変更した場合のみ** `expectedCode = expectedCodeRef.current` を payload に同梱する（API は `code` 指定時 `expectedCode` 必須・`tags.ts:41-44`）。code を変えていなければ `expectedCode` は送らない（後方互換・`label`/`category` 単独更新は従来どおり通る）。
- 別 admin が先に同 tag を rename していた場合、API repository（`tagDefinitions.ts:131-133` 事前判定 + `:163-166` UPDATE 0 行判定）が `stale` を返し、route が 409 `tag_stale_conflict`（`tags.ts:208`）にマップ。UI は `conflictKind="stale"` で「最新を再読込」導線を出す。
- stale conflict 時は code conflict と異なる文言で画面更新を促す。古い `expectedCode` のまま再送して上書きしないことを優先し、差分プレビューや自動再 fetch は別拡張とする。
- **version 列を足さない**: `tag_definitions` に etag/version 列を追加すると D1 schema 変更（migration）が必要で不変条件「D1 schema 変更なし」に反する。既存 `code`（UNIQUE NOT NULL）を CAS token に流用する設計を API（issue-1069）が確立済みで、UI はそれに乗るだけ。

## 2.6 入出力・副作用・エラーハンドリング定義

| 操作 | 入力 | 出力（成功） | 副作用 | エラー（status / code） | UI ハンドリング |
| --- | --- | --- | --- | --- | --- |
| 一覧取得（page.tsx） | `searchParams.q?` | `{ total, items: AdminTagRef[] }` | なし（read・proxy 経由 GET） | `ADMIN_FETCH_*`（`safeServerFetch` で SafeResult） | `AdminSectionErrorClient` |
| 行選択（Panel） | `tagId` | 編集フォーム表示 | なし（local state） | — | — |
| label/category 更新 | `{ label?, category? }`（変更分のみ） | 200 `AdminTagRef` | API: `admin.tag.updated` audit append | 400 `no_update_fields` / `invalid_body`、401、403、5xx | `formError` / toast（hook 既定） |
| code rename | `{ code, expectedCode }`（+ 任意で label/category） | 200 `AdminTagRef`（新 code） | API: `admin.tag.code_renamed`（+ 変われば `updated`）audit append | 409 `tag_code_conflict`（UNIQUE）/ 409 `tag_stale_conflict`（CAS）/ 400 `invalid_body`（expectedCode 欠落）/ 404 `tag_not_found` | conflict 種別で分離表示（§2.4.2） |
| 保存成功反映（Panel） | `updated: AdminTagRef` | `rows` の該当 row 置換 | なし（optimistic・local state） | — | — |

> 副作用（D1 write・audit）はすべて `apps/api` 側で発生する。`apps/web` は proxy 経由でしか到達せず D1 binding には触れない（不変条件 #5）。401（未認証）は `useAdminMutation` が `AuthRequiredError` → login redirect、403 は toast で処理（`useAdminMutation.ts:192-200`）。

## 2.7 状態遷移（一覧 → 行選択 → 編集 → 保存成功/conflict/cancel）

```
[一覧表示]
  │  行クリック（setSelectedTagId）
  ▼
[行選択 = 編集フォーム表示]  TagMasterEditForm（key=row.tagId で再マウント・expectedCodeRef=row.code）
  │
  ├─ 入力変更（code/label/category）──────────────┐
  │                                               ▼
  ├─ submit ──▶ client validation NG ──▶ [fieldErrors 表示]（フォーム維持）
  │
  ├─ submit ──▶ 変更 0 件 ──────────▶ [formError「変更がありません」]（発火しない）
  │
  ├─ submit ──▶ trigger ──▶ 200 ──▶ onSaved(updated) ──▶ [一覧 row を optimistic 置換]（選択維持）
  │                          │
  │                          ├─ 409 tag_code_conflict ──▶ [conflictKind="code"]（code 再入力）
  │                          ├─ 409 tag_stale_conflict ─▶ [conflictKind="stale"]──「最新を再読込」▶ router.refresh ▶ [一覧再取得]
  │                          └─ 400/404/5xx/network ────▶ [formError]
  │
  └─ cancel ──▶ onCancel ──▶ [選択解除 = 一覧のみ表示]
```

## 2.8 設計上の不変条件遵守表

| 不変条件 | 内容 | 本設計での遵守 |
| --- | --- | --- |
| #1 | 実フォーム schema をコードに固定しすぎない／既存 API surface のみ利用・新 endpoint / D1 schema / Form 変更禁止 | `apps/api` 無変更。既存 `PATCH /admin/tags/:tagId`・`GET /admin/tags` のみ消費。proxy も既存 `PATCH = proxy`（`route.ts:125`）を再利用し新 proxy route を作らない |
| #2 | 色は OKLch token 正本・HEX 直書き / `bg-[#xxx]` 禁止 | 新規 component は `var(--ubm-color-*)` のみ使用（`MemberTagInlineCreate` / `AdminPageHeader` の token 用法に整合）。`verify:design-tokens` gate で検証 |
| #5 | D1 直接アクセスは `apps/api` に閉じる | `apps/web` は `safeServerFetch` / `fetch('/api/admin/...')` で proxy 経由のみ。D1 binding 不参照 |
| #9 | admin form input は `FormField` 経由を標準・`components/admin/` 配下で直接 `<input>` を増やさない | `TagMasterEditForm` の code/label/category は `FormField` + `Input`。新規 component は `features/admin/components/_tags/` 配下（`components/admin/` に `<input>` を足さない） |
| #10 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由・legacy `@/lib/useAdminMutation` 参照を増やさない | PATCH は `features/admin/hooks/useAdminMutation`（`"PATCH"` overload）経由。raw `updateTag` はテスト/非 hook 再利用向けで mutation 発火は hook が担う |
| #7（参照） | GAS prototype を本番仕様に昇格させない／API 本体変更禁止 | API は issue-1069 完成 surface をそのまま消費 |

新規識別子（`tag-master` nav id / `AdminTagUpdateInput` / `AdminTagUpdateErrorCode` / `TagUpdateError` / `updateTag` / `parseTagUpdateErrorCode` / `TagMasterPanel` / `TagMasterEditForm`）はすべて Phase 1 §1.4 の既存命名規則に整合する。
