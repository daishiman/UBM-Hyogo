# Phase 4: テスト作成（TDD Red）

`[実装区分: 実装仕様書]` / status: `completed`

本 Phase は Phase 2 の設計 SSOT を実行可能テストとして固定し、automation-30 改善で Green まで実装した。テストは命名規則 #8 に従い `*.spec.ts` / `*.component.spec.tsx` のみとし、`*.test.*` は使わない。

## 4.1 テストファイル一覧（3 本・新規）

| パス | 種別 | 対象 | 受け持つ AC |
|------|------|------|-------------|
| `apps/web/src/components/admin/__tests__/tagCatalogLifecycle.spec.ts` | pure unit（vitest） | `tagCatalogLifecycle.ts`（descriptor / availableOps / statusLabel / parseTagLifecycleError） | AC-3, AC-4, AC-6, AC-7 の論理基盤 |
| `apps/web/src/components/admin/__tests__/TagCatalogPanel.component.spec.tsx` | component（vitest + @testing-library/react） | `TagCatalogPanel.tsx`（state machine / mutation 配線 / 409・404 表示 / confirm 制御） | AC-0, AC-1, AC-2, AC-3, AC-6, AC-7 |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | pure unit（vitest） | `shell-config.ts`（`tag-catalog` nav / active 非衝突） | AC-0, AC-5 |

すべて `apps/web/src/components/admin/__tests__/` 配下に置く（既存 `TagQueuePanel.component.spec.tsx` と同階層）。

## 4.2 mock 方針（[VSCPKR-03] / state vs prop の明示）

| mock 対象 | 方法 | 理由 |
|-----------|------|------|
| `next/navigation` の `useRouter`（`push` / `refresh`） | `vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock, refresh: refreshMock }) }))` | panel の成功時 `router.refresh()`・filter 切替の `router.push()` を観測する。実 router を avoid |
| `@/features/admin/hooks/useAdminMutation` | `vi.mock` で `trigger` を差し替え可能な factory を返す | mutation の解決（成功）/ throw（409・404・network）を**テストごとに制御**し、HTTP を打たずに state machine を駆動する |
| `ConfirmDialog`（任意） | panel テストでは **stub せず実体**を使い、`role="dialog"` と確定ボタンを DOM で操作する | physical の confirm フロー（AC-2）を実 DOM で検証するため。row テストには ConfirmDialog は出ない |

> **操作対象が internal state か prop か（[VSCPKR-03] 明示）**
> - `TagCatalogPanel` のテストは **internal state を UI 操作（fireEvent.click）経由で間接駆動**する。`items` は `initial` prop で注入するが、filter・pendingTagId・confirm open・行ごとの 409/404 結果は **panel の internal state**であり、ボタン click → 観測（DOM / mock）で検証する。state を直接書き換えない。
> - `TagCatalogRow` のテストは **完全に prop 駆動**（state を持たない presentational）。`item` / `pending` / `error` / `onOp` を prop で渡し、render 結果と `onOp` の呼び出し引数だけを検証する。

### useAdminMutation mock の最小形（panel テスト共通 head）

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

// FetchAuthedError 相当（{ status, bodyText }）を返すヘルパ。実体 import でもよい。
import { FetchAuthedError } from "@/lib/fetch/errors";

// trigger を差し替え可能にする。endpoint/method ごとに別 hook が呼ばれる設計のため、
// テストでは「最後に呼ばれた trigger の payload/endpointOverride」を記録する。
const triggerMock = vi.fn();
vi.mock("@/features/admin/hooks/useAdminMutation", () => ({
  useAdminMutation: (endpoint: string, method: string, options?: Record<string, unknown>) => ({
    trigger: (payload: unknown, endpointOverride?: string) =>
      triggerMock({ endpoint, method, payload, endpointOverride, options }),
    isLoading: false,
    error: null,
    reset: vi.fn(),
    abort: vi.fn(),
  }),
}));

import { TagCatalogPanel } from "../TagCatalogPanel";
import type { TagCatalogItem } from "../tagCatalogLifecycle";

const item = (over: Partial<TagCatalogItem> = {}): TagCatalogItem => ({
  tagId: "t_1",
  code: "shinkokai",
  label: "懇親会",
  category: "event",
  active: true,
  ...over,
});

beforeEach(() => {
  pushMock.mockClear();
  refreshMock.mockClear();
  triggerMock.mockReset();
  triggerMock.mockResolvedValue(undefined); // 既定は成功（204/200）
});
afterEach(() => cleanup());
```

> mock の `trigger` は呼び出しごとに `triggerMock` を経由するため、`triggerMock.mockRejectedValueOnce(new FetchAuthedError(409, JSON.stringify({ error: "tag_has_references", referenceCount: 3 })))` のように**ケースごとに解決値/throw を差し替える**ことで 409/404/network を再現する。panel が `trigger` を `await` し `catch` で `parseTagLifecycleError` に渡す前提（Phase 2 §2.5）に一致する。

## 4.3 `tagCatalogLifecycle.spec.ts`（pure unit・Red）

副作用なし。import 1 行で全関数を検証する。

| # | describe / it | 入力 | 期待値 | AC |
|---|---------------|------|--------|----|
| L-1 | `lifecycleDescriptor("reactivate")` | — | `method==="POST"`, `endpoint("t1")==="/admin/tags/t1/reactivate"`, `buttonLabel` に「棚に戻す」, `intent==="neutral"`, `requiresConfirm===false` | AC-4 |
| L-2 | `lifecycleDescriptor("logical_delete")` | — | `method==="DELETE"`, `endpoint("t1")==="/admin/tags/t1"`, `buttonLabel` に「棚にしまう」, `intent==="caution"`, `requiresConfirm===false` | AC-4 |
| L-3 | `lifecycleDescriptor("physical_delete")` | — | `method==="DELETE"`, `endpoint("t1")==="/admin/tags/t1/physical"`, `buttonLabel` に「完全に削除」, `intent==="destructive"`, `requiresConfirm===true`, `confirmDescription` に「元に戻せない」を含む | AC-2, AC-4 |
| L-4 | `availableOps(true)`（active 行） | `true` | `["logical_delete","physical_delete"]`（順序固定・`reactivate` を含まない） | AC-4 |
| L-5 | `availableOps(false)`（inactive 行） | `false` | `["reactivate","physical_delete"]`（順序固定・`logical_delete` を含まない） | AC-4 |
| L-6 | `statusLabel(true)` / `statusLabel(false)` | — | `"有効"` / `"停止中"`（文言は実装で固定・本表が SSOT） | AC-4 |
| L-7 | `parseTagLifecycleError(409, '{"error":"tag_has_references","referenceCount":3}')` | 409 + JSON | `{ kind:"tag_has_references inline error", referenceCount:3 }` | AC-3 |
| L-8 | `parseTagLifecycleError(FetchAuthedError(409, '{"error":"tag_has_references"}'))`（count 欠落） | 409 + count なし | `code==="tag_has_references"` かつ generic count なし文言。NaN を出さない | AC-3 |
| L-9 | `parseTagLifecycleError(FetchAuthedError(409, "not-json"))`（body 非 JSON） | 409 + 壊れた body | `code==="http_409"`。汎用 parser として tag_has_references inline error に誤分類しない | AC-3 |
| L-10 | `parseTagLifecycleError(404, '{"error":"tag_not_found"}')` | 404 + JSON | `{ kind:"not_found" }` | AC-7 |
| L-11 | `parseTagLifecycleError(500, '{"error":"internal"}')` | 500 | `kind==="other"` かつ `message` に何らかの文字列（toast 用） | — |
| L-12 | `availableOps` の戻り値が **新規配列**で呼び出しごとに mutate 不能（`Object.isFrozen` か `readonly` 設計） | — | 返却配列を変更しても次回呼び出しに影響しない（純粋性回帰 guard） | AC-5 |

> L-8 / L-9 が **fail-safe 設計の核心**: 409 は「削除不可」が本質であり、count が読めなくても削除をブロックする（referenceCount 表示は「使用中のため削除不可」に degrade）。実装は `JSON.parse` を try/catch し、失敗時は `referenceCount: 0` を返す。

## 4.4 `TagCatalogPanel.component.spec.tsx`（component・Red）

`initial`（list）/ `filter` を prop で注入し、UI 操作で internal state を駆動する。

| # | describe / it | 操作 | 期待値 | AC |
|---|---------------|------|--------|----|
| P-1 | items 複数 → 一覧表示 | `initial={{total:2, items:[active行, inactive行]}}` を render | `role="region"`（name に「タグカタログ」相当）が存在。両行の `label`（「懇親会」等）が表示される。各行に操作ボタンが描画される | AC-0 |
| P-2 | items=[] → 空表示 | `initial={{total:0, items:[]}}` | 「タグがありません」相当の空文言が表示され、行が 0 件 | AC-0 |
| P-3 | reactivate 成功 → refresh | inactive 行（active:false）の「棚に戻す」click。`triggerMock` 既定成功 | `triggerMock` が `method:"POST"` かつ `endpoint`/`endpointOverride` が `/admin/tags/t_1/reactivate` で 1 回呼ばれる。成功後 `refreshMock` が呼ばれる | AC-1 |
| P-4 | physical：confirm **なし**で API 未呼出 | active 行の「完全に削除」click（ConfirmDialog が open するだけ） | `triggerMock` が **呼ばれない**（`expect(triggerMock).not.toHaveBeenCalled()`）。`role="dialog"` が表示され、「元に戻せない」文言を含む | AC-2 |
| P-5 | physical：confirm **あり**で DELETE physical 呼出 | active 行の「完全に削除」click → dialog 内の確定ボタン（`data-destructive="true"`）click。`triggerMock` 成功 | `triggerMock` が `method:"DELETE"` かつ endpoint が `/admin/tags/t_1/physical` で呼ばれる。成功後 dialog が閉じ `refreshMock` 呼出 | AC-2 |
| P-6 | 409 → 「N人に使用中」表示 | physical confirm 確定。`triggerMock.mockRejectedValueOnce(new FetchAuthedError(409, '{"error":"tag_has_references","referenceCount":7}'))` | 当該行に `role="status"`（または alert）で **「7人に使用中のため削除不可」** を含むメッセージ。`refreshMock` は呼ばれない（list 維持）。dialog は閉じる | AC-3 |
| P-7 | 404 → 「既に削除済み」 | logical_delete 実行。`triggerMock.mockRejectedValueOnce(new FetchAuthedError(404, '{"error":"tag_not_found"}'))` | 当該行（または panel）に **「既に削除済み」** 相当の文言。`refreshMock` が呼ばれる（list を最新化） | AC-7 |
| P-8 | 冪等 reactivate → エラーを出さない | helper/list update レベルで active row + reactivate success row を適用 | エラーバナー相当を生成せず active 状態を維持。UI では active 行に reactivate ボタンを出さないため helper/handler contract として検証 | AC-6 |
| P-9 | 操作中の二重 click 抑止 | trigger を未解決 Promise にして click を 2 回 | `triggerMock` の呼び出しは 1 回（pendingTagId による guard） | AC-1, AC-2 |

> P-6 の「N人」は `parseTagLifecycleError` の `referenceCount` から組み立てる（panel は pure helper を経由する）。テストは数値 `7` を body に埋め、表示文字列にその数値が出ることを `screen.getByText(/7人/)` 等で確認する。

### panel テストの基本骨格（P-3 を例に）

```typescript
it("P-3: inactive 行の reactivate 成功で POST 呼出 → refresh", async () => {
  render(<TagCatalogPanel initial={{ total: 1, items: [item({ tagId: "t_1", active: false })] }} filter="all" />);
  fireEvent.click(screen.getByRole("button", { name: /棚に戻す/ }));
  await Promise.resolve(); // microtask flush
  const call = triggerMock.mock.calls.at(-1)?.[0];
  expect(call.method).toBe("POST");
  expect(call.endpointOverride ?? call.endpoint).toContain("/admin/tags/t_1/reactivate");
  expect(refreshMock).toHaveBeenCalled();
});
```

## 4.5 `TagCatalogRow.component.spec.tsx`（component・prop 駆動・Red）

state を持たない presentational。`onOp` callback の呼び出し引数と、active/inactive の操作出し分けを検証する。

| # | describe / it | prop | 期待値 | AC |
|---|---------------|------|--------|----|
| R-1 | active 行の操作出し分け | `item({active:true})` | ボタン群に **「棚にしまう（停止）」** と **「完全に削除（元に戻せない）」** が出る。**「棚に戻す」は出ない** | AC-4 |
| R-2 | inactive 行の操作出し分け | `item({active:false})` | ボタン群に **「棚に戻す（再有効化）」** と **「完全に削除」** が出る。**「棚にしまう」は出ない** | AC-4 |
| R-3 | status badge 文言 | `item({active:true})` / `{active:false}` | active で「有効」、inactive で「停止中」の status 表示（`data-status="active"/"inactive"`） | AC-4 |
| R-4 | intent の data 属性 | active 行 render | 「完全に削除」ボタンに `data-intent="destructive"`、「棚にしまう」に `data-intent="caution"`。inactive 行の「棚に戻す」に `data-intent="neutral"` | AC-4 |
| R-5 | onOp 委譲（logical） | active 行の「棚にしまう」click。`onOp=vi.fn()` | `onOp` が `("logical_delete", item)` で 1 回呼ばれる（row は mutation を持たない） | AC-4, AC-5 |
| R-6 | onOp 委譲（physical） | 「完全に削除」click | `onOp` が `("physical_delete", item)` で呼ばれる | AC-4 |
| R-7 | onOp 委譲（reactivate） | inactive 行の「棚に戻す」click | `onOp` が `("reactivate", item)` で呼ばれる | AC-1, AC-4 |
| R-8 | pending 時は操作 disabled | `pending={true}` | 全操作ボタンが `disabled`（二重操作不能・state machine の lock を可視化） | AC-1 |
| R-9 | 行 inline error 表示 | `error={{kind:"tag_has_references inline error", referenceCount:5}}` | `role="status"`（or alert）で「5人に使用中のため削除不可」が出る | AC-3 |
| R-10 | aria-label に tag label | active 行 render | 「完全に削除」ボタンの `aria-label` に tag の `label`（「懇親会」）を含む | AC-8 |

### row テストの基本骨格（R-5 を例に）

```typescript
import { TagCatalogRow } from "../TagCatalogRow";

it("R-5: active 行の『棚にしまう』で onOp('logical_delete', item)", () => {
  const onOp = vi.fn();
  const it_ = item({ tagId: "t_1", active: true });
  render(<table><tbody><TagCatalogRow item={it_} pending={false} error={null} onOp={onOp} /></tbody></table>);
  fireEvent.click(screen.getByRole("button", { name: /棚にしまう/ }));
  expect(onOp).toHaveBeenCalledTimes(1);
  expect(onOp).toHaveBeenCalledWith("logical_delete", it_);
});
```

> `TagCatalogRow` が `<tr>` を返す設計なら、render は `<table><tbody>...</tbody></table>` でラップする（DOM 妥当性。jsdom warning 回避）。div ベースの grid 行なら不要。Phase 5 の実装形に合わせる。

## 4.6 命名規則・TDD Red 前提（明示）

- ファイル名は **`tagCatalogLifecycle.spec.ts` / `TagCatalogPanel.component.spec.tsx` / `TagCatalogRow.component.spec.tsx`**。`*.test.*` は CLAUDE.md 不変条件 #8（lefthook `block-test-suffix` / CI `verify-test-suffix`）で reject されるため使用禁止。
- **Red であること**: Phase 5 実装前に本テスト群を走らせると、`../tagCatalogLifecycle`・`../TagCatalogPanel`・`../TagCatalogRow` が未作成のため **module resolution error で全 fail** する。これが TDD の Red であり、Phase 5 の実装で Green に転じる。
- mutation は `@/features/admin/hooks/useAdminMutation` 経由のみ（#10）を mock 境界とする。テストが直接 `fetch` を叩かないことで、UI 契約と HTTP 契約の分離を保つ。

## 4.7 検証コマンド（Phase 4 単体）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin/__tests__/tagCatalogLifecycle.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin/__tests__/TagCatalogPanel.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin/__tests__/TagCatalogRow.component.spec.tsx
```

実装前は全 fail（Red）が正。Phase 5 完了後に全 pass（Green）へ。
