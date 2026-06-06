# Phase 5: 実装（TDD Green）

> 正本: `outputs/phase-1/phase-1.md`（§1.7 inventory）+ `DESIGN-BRIEF.md` §3-§4。
> 本フェーズは Phase 4 で Red にしたテストを Green にするための **実装手順（差分方針）** を後続実装者が迷わない粒度で確定する。
> 実装区分は **新規 6 / 編集 2**（apps/web のみ）。`apps/api` は一切変更しない（不変条件 #1 / #7）。D1 直接アクセスなし（不変条件 #5）。
> commit / push / PR / staging deploy / authenticated visual capture / Issue 状態変更は user-gated（本フェーズでは実施しない）。Issue #1116 は CLOSED（`Refs #1116` のみ）。

## 0. 新規作成 / 編集ファイル一覧（[Feedback RT-03] 必須）

| 種別 | パス | 変更 | 主要構造 |
| --- | --- | --- | --- |
| web API client | `apps/web/src/features/admin/api/tags.ts` | **新規** | `updateTag(tagId, input)` + `AdminTagUpdateErrorCode` + `parseTagUpdateErrorCode` + `TagUpdateError` + `AdminTagRef` re-export |
| client component | `apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx` | **新規** | `FormField`×3 編集フォーム。行 code を expectedCode 保持。`useAdminMutation` PATCH。409 分離表示 |
| client component | `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx` | **新規** | 一覧 + 行選択 → `TagMasterEditForm` 表示。mutation 成功で row 反映 |
| admin route | `apps/web/app/(admin)/admin/tag-master/page.tsx` | **新規** | server component。`safeServerFetch('/admin/tags?...')` で一覧取得し `TagMasterPanel` 描画 |
| nav config | `apps/web/src/components/shell/shell-config.ts` | **編集** | `ShellNavItemId` に `"tag-master"`、admin group に nav item 追加 |
| nav icon | `apps/web/src/components/shell/icons.tsx` | **編集** | `PATHS` に `"tag-master"` SVG path 追加 |

### 非変更ファイルの明示

- `apps/web/app/api/admin/[...path]/route.ts`（catch-all proxy）は **変更しない**。`PATCH /api/admin/tags/:tagId` は既に転送される。
- `apps/api/**` は **変更しない**（PATCH code/expectedCode・409 分離は issue-1069 で完備・`tags.ts:180-233`）。
- `apps/web/src/features/admin/api/members.ts` は `fetchTagMaster`（read）/ `AdminTagRef` を提供済み。`tags.ts` は `AdminTagRef` を import + re-export し、read は `members.ts` の `fetchTagMaster` を再利用する（新規 read client は作らない）。

## 実装順序

(1) tags.ts API client → (2) TagMasterEditForm → (3) TagMasterPanel → (4) page.tsx → (5) shell-config.ts + icons.tsx nav 配線。
依存方向（下位→上位）に沿うため、この順で実装すると各段階で typecheck が通る。

---

## 1. `apps/web/src/features/admin/api/tags.ts`（新規）

既存 `members.ts` の `createTag` / `parseTagErrorCode` / `TagCreateError` を逐語踏襲した update 版。

### 1.1 import / 型

```ts
// issue-1116: admin tag master code/label/category 編集の web API client。
//   D1 直接アクセス禁止（不変条件 #1/#5）。/api/admin プロキシ経由で API worker を叩く。
//   read は members.ts の fetchTagMaster を再利用し、本ファイルは PATCH（update）に限定する。
import type { AdminTagRef } from "./members";

export type { AdminTagRef };

/** 既知の update error code（PATCH /admin/tags/:tagId の fail() が返す code）。 */
export type AdminTagUpdateErrorCode =
  | "tag_code_conflict"   // UNIQUE 衝突（409）
  | "tag_stale_conflict"  // optimistic CAS mismatch（409）
  | "tag_not_found"       // 404
  | "no_update_fields"    // 空 body（400）
  | "invalid_body"        // CODE_RE 違反等（400）
  | "invalid_json";       // JSON parse 失敗（400）

const KNOWN_TAG_UPDATE_ERROR_CODES: readonly AdminTagUpdateErrorCode[] = [
  "tag_code_conflict",
  "tag_stale_conflict",
  "tag_not_found",
  "no_update_fields",
  "invalid_body",
  "invalid_json",
];
```

### 1.2 `TagUpdateError`（`TagCreateError` 踏襲）

```ts
export class TagUpdateError extends Error {
  readonly status: number;
  readonly code: AdminTagUpdateErrorCode | null;
  readonly bodyText: string;
  constructor(status: number, code: AdminTagUpdateErrorCode | null, bodyText: string) {
    super(`updateTag failed: HTTP ${status}${code ? ` (${code})` : ""}`);
    this.name = "TagUpdateError";
    this.status = status;
    this.code = code;
    this.bodyText = bodyText;
  }
}
```

### 1.3 `parseTagUpdateErrorCode`（`parseTagErrorCode` 踏襲）

```ts
export function parseTagUpdateErrorCode(bodyText: string): AdminTagUpdateErrorCode | null {
  let parsed: unknown;
  try { parsed = JSON.parse(bodyText); } catch { return null; }
  if (typeof parsed !== "object" || parsed === null) return null;
  const code = (parsed as { error?: unknown }).error;
  return KNOWN_TAG_UPDATE_ERROR_CODES.includes(code as AdminTagUpdateErrorCode)
    ? (code as AdminTagUpdateErrorCode)
    : null;
}
```

### 1.4 `updateTag`（PATCH・`createTag` 踏襲）

- **入力**: `tagId: string` + `input: { code?: string; label?: string; category?: string; expectedCode?: string }`。
- **重要**: `input` は呼び出し側（フォーム）が **変更フィールドのみ + code 指定時のみ expectedCode** を組み立てて渡す。`updateTag` は受け取った `input` をそのまま body に JSON 化する（`undefined` キーは `JSON.stringify` が自然に落とすが、呼び出し側でも明示的に code 未変更時は `expectedCode` を入れない）。

```ts
export async function updateTag(
  tagId: string,
  input: { code?: string; label?: string; category?: string; expectedCode?: string },
): Promise<AdminTagRef> {
  const res = await fetch(`/api/admin/tags/${encodeURIComponent(tagId)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin",
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new TagUpdateError(res.status, parseTagUpdateErrorCode(bodyText), bodyText);
  }
  const json = (await res.json()) as AdminTagRef & { active?: number };
  return { tagId: json.tagId, code: json.code, label: json.label, category: json.category };
}
```

> これで U-T1..U-T6 / U-P1 が Green。`encodeURIComponent(tagId)` で U-T1b を満たす。

> **`useAdminMutation` との関係**: フォームの実 mutation は `useAdminMutation(endpoint, "PATCH", ...)` 経由で行う（不変条件 #10）。`updateTag` は非 hook な raw helper / テスト向けに併設する（`members.ts` の `createTag` と同じ二経路方針）。フォームでは `useAdminMutation` の fetch 経路をそのまま使い、409 の bodyText 解析に `parseTagUpdateErrorCode` を共用する。

---

## 2. `apps/web/src/features/admin/components/_tags/TagMasterEditForm.tsx`（新規）

`"use client"`。`MemberTagInlineCreate`（drawer 内）と同じ FormField + useAdminMutation の組み立てを踏襲する。

### 2.1 props / state

```ts
import { useState } from "react";
import { FormField } from "../../../../components/ui/FormField";
import { useAdminMutation } from "../../hooks/useAdminMutation";
import { FetchAuthedError } from "../../../../lib/fetch/errors";
import { parseTagUpdateErrorCode } from "../../api/tags";
import type { AdminTagRef } from "../../api/members";

interface TagMasterEditFormProps {
  readonly tag: AdminTagRef;
  readonly onSuccess?: (updated: AdminTagRef) => void;
  readonly onCancel?: () => void;
}
```

- state: `code` / `label` / `category` を `tag` 由来で初期化（`useState(tag.code)` 等）。
- **expectedCode は state ではなく `tag.code`（行ロード時の値）を直接参照** する。フォーム内で code を編集しても expectedCode は元の `tag.code` のまま（CAS token）。
- 入力中文言の error 用 state: `conflict: AdminTagUpdateErrorCode | null`（or 文言 string）。

### 2.2 body 組み立て（AC-2 / AC-4 の核心）

submit 時、現在の入力値と `tag` の差分から body を構築する。

```ts
const buildBody = () => {
  const body: { code?: string; label?: string; category?: string; expectedCode?: string } = {};
  if (code !== tag.code) { body.code = code; body.expectedCode = tag.code; } // code 変更時のみ expectedCode 同梱
  if (label !== tag.label) body.label = label;
  if (category !== tag.category) body.category = category;
  return body;
};
```

- code 未変更時は `body.code` も `body.expectedCode` も入れない（E-T3 / E-T3b / U-T1c を満たす）。
- 差分ゼロ（`Object.keys(body).length === 0`）なら client 前検証で mutation を発火せず「変更がありません」を表示（E-T3c）。

### 2.3 mutation 配線（不変条件 #10）

```ts
const mutation = useAdminMutation<AdminTagRef>(
  `/api/admin/tags/${tag.tagId}`,
  "PATCH",
  {
    refreshOnSuccess: false,            // 一覧反映は onSuccess で親へ通知（router.refresh の代替）
    onSuccess: (updated) => onSuccess?.(updated),
    onError: (e) => {
      if (e instanceof FetchAuthedError && e.status === 409) {
        setConflict(parseTagUpdateErrorCode(e.bodyText)); // tag_code_conflict / tag_stale_conflict を分離保存
      }
    },
  },
);
```

- submit ハンドラ: `setConflict(null)` → `const body = buildBody()` → 差分ゼロなら early return（メッセージ表示）→ `await mutation.trigger(body).catch(() => {})`（onError で握る）。
- mutation 成功時に `onSuccess(updated)` が親へ新 row を渡す。

### 2.4 409 分離表示（AC-3 / E-T4 / E-T5）

`conflict` の値で文言を分ける（**名前付き map で 1 箇所集約**）。

```ts
const CONFLICT_COPY: Record<"tag_code_conflict" | "tag_stale_conflict", string> = {
  tag_code_conflict: "同じコードのタグが既に存在します。別のコードを指定してください。",
  tag_stale_conflict: "最新の状態と競合しました。一覧を再読み込みしてから編集してください。",
};
```

- conflict 表示は `role="alert"` のブロックで描画（E-T7）。stale 時は code conflict と異なる文言で画面更新を促し、古い入力のまま上書きしないことを固定する。

### 2.5 入力 UI（不変条件 #9 / #2）

- `FormField name="code" label="コード"`・`name="label" label="表示名"`・`name="category" label="カテゴリ"` の 3 つ。各 children は標準 `<input className="ui-input">`（admin 標準・`MemberTagInlineCreate` と同じ class。HEX 直書き禁止・OKLch token を使う既存 utility class のみ）。
- ボタン: 「更新」（submit）/「キャンセル」（`onCancel`）。class は既存 `ui-button` 系（OKLch token・新規色なし・不変条件 #2）。
- **色は新規追加しない**。conflict alert も既存の admin alert 用 class（`role="alert"` + 既存 danger token class）を使う。`verify:design-tokens` が `bg-[#...]` / HEX を検出しないこと。

---

## 3. `apps/web/src/features/admin/components/_tags/TagMasterPanel.tsx`（新規）

`"use client"`。`TagQueuePanel` の「一覧 + 選択 + 詳細ペイン」二分割構造を踏襲する。

### 3.1 props / state

```ts
import { useState } from "react";
import type { AdminTagRef } from "../../api/members";
import { TagMasterEditForm } from "./TagMasterEditForm";

interface TagMasterPanelProps {
  readonly initial: { readonly available: AdminTagRef[]; readonly total: number };
}
```

- state: `rows: AdminTagRef[]`（`initial.available` 初期化）/ `selectedId: string | null`。
- `selected = rows.find(r => r.tagId === selectedId) ?? null`。

### 3.2 一覧描画（P-T1 / P-T1b）

- `<section role="region" aria-label="タグ管理">` 内に一覧テーブル（`data-testid="admin-tag-master-list"`）。
- 各行は `data-testid={`admin-tag-master-row-${row.tagId}`}` のボタン（or 行内「編集」ボタン）で、`code` / `label` / `category` を表示し click で `setSelectedId(row.tagId)`。
- `rows.length === 0` のとき「該当するタグはありません」を表示し編集フォームは描画しない。

### 3.3 編集フォーム表示（P-T2 / P-T4）

- `selected` があれば `<TagMasterEditForm tag={selected} key={selected.tagId} onSuccess={...} onCancel={() => setSelectedId(null)} />` を描画。
- **`key={selected.tagId}`** を付与し、行切替時にフォーム state（code/label/category 入力）が再初期化されるようにする（P-T4 で前選択値が残らない保証）。

### 3.4 mutation 成功後の row 反映（P-T3 / AC-2 rename 後 cache）

```ts
const handleSuccess = (updated: AdminTagRef) => {
  setRows((prev) => prev.map((r) => (r.tagId === updated.tagId ? updated : r)));
  setSelectedId(updated.tagId); // 選択維持（新 code を反映した行を選択し続ける）
};
```

- これで一覧が新 `code` を即時反映（rename 後の旧 code 表示を回避・DESIGN-BRIEF §6 対策）。
- 必要なら `useRouter().refresh()` を併用して server fetch も最新化できるが、本サイクルは onSuccess の optimistic 置換で十分（focused test が固定）。

---

## 4. `apps/web/app/(admin)/admin/tag-master/page.tsx`（新規）

`/admin/tags/page.tsx` の server component パターンを踏襲する。**sibling route**（`/admin/tags/` の子にしない）。

### 4.1 構造

```ts
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { AdminPageHeader } from "../../../../src/features/admin/components/_layout/AdminPageHeader";
import { AdminSectionErrorClient } from "../../../../src/features/admin/components/_shared";
import { TagMasterPanel } from "../../../../src/features/admin/components/_tags/TagMasterPanel";
import type { AdminTagRef } from "../../../../src/features/admin/api/members";

interface TagMasterListView { total: number; items: AdminTagRef[] }

export const dynamic = "force-dynamic";

export default async function AdminTagMasterPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = sp["q"]?.trim();
  const qs = `?page=1&pageSize=50${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const result = await safeServerFetch<TagMasterListView>(`/admin/tags${qs}`);

  return (
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="ADMIN / TAG MASTER"
        title="タグ管理"
        description="タグのコード・表示名・カテゴリを編集します。"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "タグ管理" }]}
      />
      {result.ok ? (
        <TagMasterPanel initial={{ available: result.data.items ?? [], total: result.data.total ?? 0 }} />
      ) : (
        <AdminSectionErrorClient /* 既存 error props を踏襲 */ />
      )}
    </section>
  );
}
```

- API `GET /admin/tags` は `{ total, items }` を返す（`members.ts:89-92` の `TagMasterApiResponse` 形）。`items` を `available` に正規化して panel に渡す。
- `safeServerFetch` の戻り `result.ok` で error 分岐は `/admin/tags/page.tsx` と同形に揃える（`AdminSectionErrorClient` の実 props は当該ページの実装を踏襲）。

---

## 5. nav 配線（`shell-config.ts` + `icons.tsx`・編集）

### 5.1 `apps/web/src/components/shell/shell-config.ts`

- `ShellNavItemId` の union に `"tag-master"` を追加（`"tag-queue"` の隣に置く）。
- `buildAdminGroup` の items 配列で、tag-queue item の直後に新 item を追加:

```ts
{ id: "tag-queue", href: "/admin/tags", label: "タグキュー", icon: "tag-queue" },
{ id: "tag-master", href: "/admin/tag-master", label: "タグ管理", icon: "tag-master" },
```

- **sibling route**（`/admin/tag-master`）なので `isNavItemActive("/admin/tags", "/admin/tag-master")` は `"/admin/tag-master" === "/admin/tags"`（false）かつ `startsWith("/admin/tags/")`（false）で **active 衝突しない**（Phase 1 §1.3.2 の nav 衝突回避）。`isNavItemActive` 関数は変更不要。
- admin group の item 数が 10 → **11** になる（`shell-config.spec.ts:25` の `toHaveLength(10)` を Phase 6 で 11 へ更新）。

### 5.2 `apps/web/src/components/shell/icons.tsx`

- `PATHS` record に `"tag-master"` キーを追加（`ShellNavItemId` が exhaustive な `Record` のため、追加しないと typecheck が落ちる）。tag-queue（単一 tag 形）と区別できる「複数タグ / 編集」を想起させる stroke path を 1 本追加。例（既存 icon と同じ viewBox 0 0 24 24 / stroke ベース）:

```ts
"tag-master": "M9 5l-6 7 6 7M15 5l6 7-6 7M13 4l-2 16",
```

> 実際の path は既存 icon と視覚整合する範囲で実装者が確定してよい（pure presentational・state なし）。**キーの追加が typecheck 上必須** であることが要点。

## 6. DoD への寄与

- Phase 4 の U-T1..U-T6 / U-P1 / P-T1..P-T4 / E-T1..E-T7 を本差分で Green にする。
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm verify:design-tokens` PASS。
- 不変条件遵守: mutation=`useAdminMutation`（#10）/ input=`FormField`（#9）/ 色=OKLch 既存 token・HEX 無し（#2）/ D1 直アクセス無し（#5）/ `apps/api` 非変更（#1/#7）。
- commit / push / PR / staging deploy / authenticated visual capture / Issue 状態変更は user-gated（実施しない）。Issue #1116 は CLOSED（`Refs #1116` のみ）。
