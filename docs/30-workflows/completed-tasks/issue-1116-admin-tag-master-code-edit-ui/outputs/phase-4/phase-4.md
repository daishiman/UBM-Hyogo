# Phase 4: テスト作成（TDD Red）

> 正本: `outputs/phase-1/phase-1.md`（§1.6 AC / §1.7 inventory）+ `DESIGN-BRIEF.md` §3。
> 本フェーズは **実装前にテストを先に書き、新規アサーションが fail（Red）すること** を確定する設計。
> 全テストは public な web API client 関数（`updateTag` / `parseTagUpdateErrorCode`）と public な client component（`TagMasterPanel` / `TagMasterEditForm`）のみを対象とする（private 内部テスト方針は不要）。
> 新規 test ファイルは `*.spec.{ts,tsx}` のみ（不変条件 #8・`*.test.*` 禁止）。

## 0. 実行コマンド（artifacts.json verify_commands 転記）

focused web test は repo ルートから web workspace filter で実行する。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:run \
  apps/web/src/features/admin/api/__tests__/tags.update.spec.ts \
  apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx \
  apps/web/app/(admin)/admin/tag-master/page.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:design-tokens
```

回帰 nav test は Phase 6（テスト拡充）で扱う。本フェーズは新規 3 spec を Red にすることに集中する。

## 1. 命名規則整合（捏造禁止・逐語）

実コード（`apps/api/src/routes/admin/tags.ts` の `ERROR_TO_STATUS` / PATCH ハンドラ）と 1:1 で対応させる。

| 種別 | 値 | 確認 |
| --- | --- | --- |
| API error code（PATCH 200 系） | 200 → `{ tagId, code, label, category, active }`（`rowBody`） | `tags.ts:78-84,232` |
| API error code（409 UNIQUE） | `tag_code_conflict` | `tags.ts:60,207`（`ERROR_TO_STATUS`） |
| API error code（409 CAS） | `tag_stale_conflict` | `tags.ts:60,208` |
| API error code（404） | `tag_not_found` | `tags.ts:57,203,210` |
| API error code（400 空 body） | `no_update_fields` | `tags.ts:56,192` |
| API error code（400 不正 field） | `invalid_body` | `tags.ts:55,192,209` |
| web error body 形式 | `{ ok:false, error:"<code>" }` | `fail()`（`tags.ts:69-70`） |
| 新規 web client 関数 | `updateTag(tagId, input)` | `tags.ts`（apps/web 側・新規） |
| 新規 web error code 型 | `AdminTagUpdateErrorCode` | 新規 |
| 新規 web error parse | `parseTagUpdateErrorCode(bodyText)` | 新規（既存 `parseTagErrorCode` を踏襲） |
| 新規 web error class | `TagUpdateError`（`status` / `code` / `bodyText`） | 新規（既存 `TagCreateError` を踏襲） |

> 既存 `apps/web/src/features/admin/api/members.ts` の `parseTagErrorCode` / `TagCreateError` / `createTag` を逐語踏襲する（同 repo の確立済みパターン）。

## 2. web API client テスト（`apps/web/src/features/admin/api/__tests__/tags.update.spec.ts`・新規）

### 2.1 mock 方針

`members.tagCreate.spec.ts` の `mockFetch` ヘルパを逐語踏襲する。

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  updateTag,
  parseTagUpdateErrorCode,
  TagUpdateError,
  type AdminTagRef,
} from "../tags";

const mockFetch = (status: number, body: unknown, bodyIsJson = true) => {
  const ok = status >= 200 && status < 300;
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok, status,
    json: async () => body,
    text: async () => (bodyIsJson ? JSON.stringify(body) : String(body)),
  } as Response);
};

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.restoreAllMocks());
```

> `AdminTagRef` は `tags.ts` から re-export するか `members.ts` の既存型を import する（Phase 5 で `tags.ts` 側に `import type { AdminTagRef } from "./members"` + re-export を決定。本 spec は `../tags` から import する前提で書く）。

### 2.2 ケース表（期待値付き・CONST_005）

| ID | テスト | Arrange | Act | Assert |
| --- | --- | --- | --- | --- |
| U-T1 | 200 成功 → AdminTagRef を返し PATCH + body で叩く | `mockFetch(200, { tagId:"t1", code:"vip2", label:"VIP", category:"membership", active:1 })` | `updateTag("t1", { code:"vip2", label:"VIP", category:"membership", expectedCode:"vip" })` | 戻り値 `toEqual({ tagId:"t1", code:"vip2", label:"VIP", category:"membership" })`（`active` 除外 4 項目）。`fetchSpy` の `url === "/api/admin/tags/t1"`・`init.method === "PATCH"`・`JSON.parse(init.body)` が `{ code:"vip2", label:"VIP", category:"membership", expectedCode:"vip" }` |
| U-T1b | tagId を encodeURIComponent でエスケープ | `mockFetch(200, { tagId:"a/b", code:"x", label:"L", category:"c", active:1 })` | `updateTag("a/b", { label:"L" })` | `url === "/api/admin/tags/a%2Fb"` |
| U-T1c | label 単独更新時は expectedCode を **送信しない** | `mockFetch(200, {...})` | `updateTag("t1", { label:"New" })` | `JSON.parse(init.body)` が `{ label:"New" }`（`expectedCode` キー不在・`code` キー不在） |
| U-T2 | 409 tag_code_conflict → TagUpdateError(code, status=409) | `mockFetch(409, { ok:false, error:"tag_code_conflict" })` | `updateTag("t1", { code:"dup", expectedCode:"vip" })` | `rejects.toMatchObject({ code:"tag_code_conflict", status:409 })`。再実行して `e instanceof TagUpdateError` かつ `e.code === "tag_code_conflict"` |
| U-T3 | 409 tag_stale_conflict → TagUpdateError(code, status=409) | `mockFetch(409, { ok:false, error:"tag_stale_conflict" })` | `updateTag("t1", { code:"vip2", expectedCode:"stale" })` | `rejects.toMatchObject({ code:"tag_stale_conflict", status:409 })` |
| U-T4 | 404 tag_not_found → TagUpdateError(code, status=404) | `mockFetch(404, { ok:false, error:"tag_not_found" })` | `updateTag("missing", { label:"X" })` | `rejects.toMatchObject({ code:"tag_not_found", status:404 })` |
| U-T5 | 400 no_update_fields → TagUpdateError(code, status=400) | `mockFetch(400, { ok:false, error:"no_update_fields" })` | `updateTag("t1", {})` | `rejects.toMatchObject({ code:"no_update_fields", status:400 })` |
| U-T5b | 400 invalid_body → TagUpdateError(code, status=400) | `mockFetch(400, { ok:false, error:"invalid_body" })` | `updateTag("t1", { code:"Bad!", expectedCode:"vip" })` | `rejects.toMatchObject({ code:"invalid_body", status:400 })` |
| U-T6 | 不明 code の !res.ok でも throw（code は null） | `mockFetch(500, { ok:false, error:"boom" })` | `updateTag("t1", { label:"X" })` | `rejects.toMatchObject({ code:null, status:500 })` |

### 2.3 `parseTagUpdateErrorCode` の単体ケース（U-P1）

`parseTagErrorCode`（`members.ts:224-236`）と同じ純関数で、既知 update code セット（`tag_code_conflict` / `tag_stale_conflict` / `tag_not_found` / `no_update_fields` / `invalid_body` / `invalid_json`）を判定する。

| 入力 `bodyText` | 期待戻り値 |
| --- | --- |
| `'{"ok":false,"error":"tag_code_conflict"}'` | `"tag_code_conflict"` |
| `'{"ok":false,"error":"tag_stale_conflict"}'` | `"tag_stale_conflict"` |
| `'{"ok":false,"error":"tag_not_found"}'` | `"tag_not_found"` |
| `'{"ok":false,"error":"no_update_fields"}'` | `"no_update_fields"` |
| `'{"ok":false,"error":"invalid_body"}'` | `"invalid_body"` |
| `'{"ok":false,"error":"unknown_x"}'`（未知 code） | `null` |
| `"{not json"`（不正 JSON） | `null` |
| `'{"ok":false}'`（error 欠落） | `null` |
| `'"just a string"'`（非オブジェクト） | `null` |
| `""`（空文字） | `null` |

## 3. component テスト（`TagMasterPanel.spec.tsx`・新規）

### 3.1 mock 方針

`MemberDrawer.tagInlineCreate.spec.tsx` の useAdminMutation mock パターンを踏襲する。`TagMasterPanel` は server component（page.tsx）から初期一覧（`{ available: AdminTagRef[], total }`）を props で受け取り、行選択で `TagMasterEditForm` を表示する client component。

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

// PATCH mutation（/api/admin/tags/:tagId）を mock
type MutOptions = { onSuccess?: (d: unknown) => void | Promise<void>; onError?: (e: Error) => void };
const patch = { trigger: vi.fn(), options: null as MutOptions | null };
vi.mock("../../../hooks/useAdminMutation", async () => {
  const errors = await import("../../../../../lib/fetch/errors");
  return {
    FetchAuthedError: errors.FetchAuthedError,
    useAdminMutation: (_e: string, _m: string, options: MutOptions) => {
      patch.options = options;
      return { trigger: patch.trigger, isLoading: false, error: null, reset: vi.fn(), abort: vi.fn() };
    },
  };
});

import { TagMasterPanel } from "../TagMasterPanel";

const VIP: AdminTagRef = { tagId:"t_vip", code:"vip", label:"VIP会員", category:"membership" };
const ENG: AdminTagRef = { tagId:"t_eng", code:"engineer", label:"エンジニア", category:"occupation" };
```

> mutation の endpoint は trigger 時の `endpointOverride`（`/api/admin/tags/${tagId}`）で切り替える設計。`patch.trigger` は `Promise.resolve(updatedRow)` を返す。

### 3.2 ケース表

| ID | テスト | Arrange | Act | Assert |
| --- | --- | --- | --- | --- |
| P-T1 | 一覧描画 | `render(<TagMasterPanel initial={{ available:[VIP,ENG], total:2 }} />)` | — | `screen.getByText("vip")` / `screen.getByText("engineer")` が存在。`screen.getByRole("region", { name:"タグ管理" })`（or 一覧 testid `admin-tag-master-list`）が存在 |
| P-T1b | 空一覧で「該当するタグはありません」 | `render(<TagMasterPanel initial={{ available:[], total:0 }} />)` | — | `screen.getByText("該当するタグはありません")` が存在。編集フォームは描画されない（`screen.queryByLabelText("コード")` が null） |
| P-T2 | 行選択で編集フォームに到達 | P-T1 と同じ初期 | `fireEvent.click(screen.getByTestId("admin-tag-master-row-t_vip"))`（or 行内「編集」ボタン） | `screen.getByLabelText("コード")` の value が `"vip"`・`screen.getByLabelText("表示名")` が `"VIP会員"`・`screen.getByLabelText("カテゴリ")` が `"membership"`（選択行の値が初期化される） |
| P-T3 | mutation 成功後 row が新値に反映 | P-T2 で行選択済・`patch.trigger = vi.fn(() => Promise.resolve({ tagId:"t_vip", code:"vip2", label:"VIP会員", category:"membership" }))` | code を `vip2` に変更 → submit → `patch.options?.onSuccess?.({ tagId:"t_vip", code:"vip2", label:"VIP会員", category:"membership" })` | `await waitFor(() => expect(screen.getByText("vip2")).toBeDefined())`。旧 `vip` 行表示が `vip2` に置換される（optimistic 置換 or onSuccess 反映） |
| P-T4 | 別行選択でフォームが切り替わる | P-T1 と同じ初期 | `t_vip` 行選択 → `t_eng` 行選択 | `screen.getByLabelText("コード")` の value が `"engineer"`（前の選択 `vip` が残らない） |

## 4. component テスト（`TagMasterPanel.spec.tsx`・拡充）

### 4.1 mock 方針

`TagMasterEditForm` は単独の編集フォーム client component（props: `tag: AdminTagRef`・`onSuccess?`・`onCancel?`）。useAdminMutation を §3.1 と同形で mock し、`patch.trigger` の引数 body を検証する。FormField の input は `fillForm`（`screen.getByLabelText`）で操作する（`MemberDrawer.tagInlineCreate.spec.tsx` の `fillForm` 踏襲）。

```ts
const fillForm = (code: string, label: string, category: string) => {
  fireEvent.change(screen.getByLabelText("コード"), { target: { value: code } });
  fireEvent.change(screen.getByLabelText("表示名"), { target: { value: label } });
  fireEvent.change(screen.getByLabelText("カテゴリ"), { target: { value: category } });
};
const submit = () => fireEvent.click(screen.getByRole("button", { name: "更新" }));
```

### 4.2 ケース表

| ID | テスト | Arrange | Act | Assert |
| --- | --- | --- | --- | --- |
| E-T1 | 初期 code を expectedCode として保持 | `render(<TagMasterEditForm tag={VIP} />)` | code を `vip2` に変更 → submit | `patch.trigger` が `{ code:"vip2", label:"VIP会員", category:"membership", expectedCode:"vip" }` で発火（行ロード時 code `vip` が expectedCode に同梱） |
| E-T2 | code 変更時 expectedCode 同梱 | `render(<TagMasterEditForm tag={VIP} />)` | code のみ `vip3` に変更（label/category 不変）→ submit | `patch.trigger` の body に `code:"vip3"` と `expectedCode:"vip"` が含まれる |
| E-T3 | label 単独更新時は expectedCode を **送信しない** | `render(<TagMasterEditForm tag={VIP} />)` | label を `VIP特別会員` に変更（code 不変）→ submit | `patch.trigger` の body が `{ label:"VIP特別会員" }`（`code` キー不在・`expectedCode` キー不在）。AC-4（後方互換）を担保 |
| E-T3b | category 単独更新時も expectedCode 非送信 | `render(<TagMasterEditForm tag={VIP} />)` | category を `vip-tier` に変更 → submit | body が `{ category:"vip-tier" }`（code/expectedCode キー不在） |
| E-T3c | 変更フィールド無し（差分ゼロ）で submit | `render(<TagMasterEditForm tag={VIP} />)` | 何も変えず submit | client 前検証で `patch.trigger` 未発火・`screen.getByText("変更がありません")`（or 同等メッセージ）。AC-4 の `no_update_fields` 防御を UI 側で担保 |
| E-T4 | 409 tag_code_conflict で専用文言 | `patch.trigger = vi.fn(() => Promise.reject(new FetchAuthedError(409, '{"ok":false,"error":"tag_code_conflict"}')))` | code を `dup` に変更 → submit | `await waitFor(() => expect(screen.getByText(/同じコードのタグが既に存在します/)).toBeDefined())`。フォームは維持（`screen.getByLabelText("コード")` が残る） |
| E-T5 | 409 tag_stale_conflict で **別文言** | `patch.trigger = vi.fn(() => Promise.reject(new FetchAuthedError(409, '{"ok":false,"error":"tag_stale_conflict"}')))` | code を `vip9` に変更 → submit | `screen.getByText(/最新の状態と競合しました/)` が存在し、**E-T4 の code_conflict 文言とは異なる**こと（`expect(text).not.toContain("同じコードのタグ")`）。AC-3 の分離表示を固定 |
| E-T6 | cancel で onCancel 呼び出し・フォーム idle | `const onCancel = vi.fn(); render(<TagMasterEditForm tag={VIP} onCancel={onCancel} />)` | code を一旦変更 → `fireEvent.click(screen.getByRole("button", { name:"キャンセル" }))` | `expect(onCancel).toHaveBeenCalled()` |
| E-T7 | a11y — 入力は label と紐付き、conflict は role=alert | `render(<TagMasterEditForm tag={VIP} />)` | — / E-T4 と同じ conflict | `getByLabelText("コード"/"表示名"/"カテゴリ")` が取得可能（FormField 紐付け）。conflict 表示後 `screen.findAllByRole("alert")` が 1 件以上 |

## 5. TDD Red の期待

- 実装前（Phase 5 適用前）は以下が **fail（Red）** する:
  - U-T1..U-T6 / U-P1: `apps/web/src/features/admin/api/tags.ts` 自体が未作成のため import エラー → 全 fail。
  - P-T1..P-T4: `TagMasterPanel` 未作成のため import エラー → 全 fail。
  - E-T1..E-T7: `TagMasterEditForm` 未作成のため import エラー → 全 fail。
- 実装後（Phase 5）に全ケースが Green になることを確認する。
- 既存テスト（`members.tagCreate.spec.ts` / `MemberDrawer.tagInlineCreate.spec.tsx` / `TagQueuePanel.component.spec.tsx` / `shell-config.spec.ts` / `SidebarNavItem.spec.tsx`）は本サイクルで **非破壊（Green 維持）** であること（nav 追加の影響は Phase 6 で固定）。

## 6. 観測点まとめ（捏造防止チェック）

- error code は全て snake_case で `apps/api/src/routes/admin/tags.ts` の `ERROR_TO_STATUS` と逐語一致（`tag_code_conflict` / `tag_stale_conflict` / `tag_not_found` / `no_update_fields` / `invalid_body`）。
- mock パターンは実在の `members.tagCreate.spec.ts`（`mockFetch`）/ `MemberDrawer.tagInlineCreate.spec.tsx`（useAdminMutation mock・`fillForm`）を踏襲。
- 全テストは public 関数 / public component のみ対象（private テスト方針なし）。
- expectedCode の送信制御（code 指定時のみ同梱）が E-T1/E-T2/E-T3 と U-T1/U-T1c で二重に固定される。
- 409 の 2 種分離（code_conflict ≠ stale_conflict）が E-T4/E-T5 で「別文言」として明示 assert される（DESIGN-BRIEF §6 リスク「stale を code と同表示」への対策）。
