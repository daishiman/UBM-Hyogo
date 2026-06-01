# Phase 4 — テスト作成（TDD Red）

実装前に、追加 / 編集する 4 つの `*.spec.tsx`（INV-4: `*.spec.{ts,tsx}` のみ）のテストケースを設計する。本 Phase では「テスト記述」のみを定義し、実装（GREEN）は Phase 5 で行う。設計時点では対象コンポーネント（`SidebarMobileTrigger` / `SidebarDrawer`）が不在のため新規 spec は import error で RED になる前提とする。

## 命名規則 / 配置（実装前確認）

| 項目 | ルール | 本タスクでの値 |
|------|--------|----------------|
| component ファイル | PascalCase `.tsx` | `SidebarMobileTrigger.tsx` / `SidebarDrawer.tsx` |
| test ファイル | `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止 = INV-4 / lefthook `block-test-suffix`） | `SidebarMobileTrigger.spec.tsx` / `SidebarDrawer.spec.tsx` |
| 配置 dir | 既存パターン踏襲 | `apps/web/src/components/shell/__tests__/` |
| ランナー | Vitest + `@testing-library/react`（jsdom） | 既存 `useSidebarState.spec.tsx` / `SidebarShell.spec.tsx` と同方式 |

## テスト対象ファイル一覧

| 種別 | spec パス | 対象 |
|------|-----------|------|
| 新規 | `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx` | `SidebarMobileTrigger.tsx`（新規） |
| 新規 | `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | `SidebarDrawer.tsx`（新規） |
| 編集 | `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx` | `useSidebarState.ts`（編集） |
| 編集 | `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | `SidebarShell.tsx`（編集 / mount 統合の回帰 1 件） |

---

## 1. `SidebarMobileTrigger.spec.tsx`（新規）

`SidebarMobileTrigger` は **外部 props を持たず `useSidebarShellContext()` を消費する Client Component**。したがってテストは props ではなく **`SidebarShellProvider` でラップして context 経由で検証する**（`drawerOpen` / `setDrawerOpen` を context value から注入し、`setDrawerOpen` は `vi.fn()` で差し込む）。`next/link` には依存しないため `next/link` mock は不要。

操作対象の明示: **internal state ではなく context 消費**。テストは provider が渡す `setDrawerOpen` の `vi.fn()` 呼び出しを assert する。

| # | ケース | 操作 | 期待 | AC |
|---|--------|------|------|----|
| T-MT-1 | click で drawer open | provider value に `setDrawerOpen: vi.fn()` を与え `<SidebarShellProvider><SidebarMobileTrigger /></SidebarShellProvider>` を render → button を `click()` | `setDrawerOpen` が `true` 1 回で呼ばれる | AC-1 |
| T-MT-2 | `md:hidden` class | render | button の `className` に `md:hidden` を含む | AC-2 |
| T-MT-3 | aria 属性（controls / expanded） | render（provider value `drawerOpen: false`） | `aria-controls="shell-drawer"` かつ `aria-expanded="false"` | AC-2 |
| T-MT-4 | aria-expanded 反映 | provider value `drawerOpen: true` で render | `aria-expanded="true"` | AC-2 |
| T-MT-5 | provider 不在で throw | provider なしで render | `useSidebarShellContext` の Error throw（既存契約） | INV-6 / 回帰 |

provider の value は `{ mode: "expanded", drawerOpen, toggleCollapsed: vi.fn(), setDrawerOpen }` の最小形（`SidebarShellContextValue` 型に一致）。

---

## 2. `SidebarDrawer.spec.tsx`（新規）

`SidebarDrawer` は **props（`open` / `onClose` / `children`）駆動**。context 不要。テストは props で `open` を切り替え、`onClose` を `vi.fn()` で受ける。Esc / backdrop / focus / body 属性は jsdom 上で検証可能。

| # | ケース | 操作 | 期待 | AC |
|---|--------|------|------|----|
| T-DR-1 | open=false で null | `<SidebarDrawer open={false} onClose={fn}>...</>` render | DOM に `[role="dialog"]` が無い（`container.firstChild` が null） | AC-3 |
| T-DR-2 | open=true で dialog 表示 | `open={true}` で render | `role="dialog"` / `aria-modal="true"` / `id="shell-drawer"` を持つ要素が 1 つ存在 | AC-3 |
| T-DR-3 | Esc で onClose | open=true、`document` に `keydown`（`key:"Escape"`）を dispatch | `onClose` が 1 回呼ばれる | AC-4 |
| T-DR-4 | backdrop click で onClose | `[data-component="shell-drawer-backdrop"]` を `click()` | `onClose` が 1 回呼ばれる | AC-4 |
| T-DR-5 | panel click では閉じない | panel（`[role="dialog"]`）内を `click()` | `onClose` が呼ばれない（backdrop と panel の責務分離回帰） | AC-4 |
| T-DR-6 | body 属性付与 | open=true で render | `document.body` が `data-shell-drawer-open="true"` を持つ | AC-6 |
| T-DR-7 | body 属性除去（close 遷移） | `rerender` で `open={false}` | `document.body` から `data-shell-drawer-open` が除去される | AC-6 |
| T-DR-8 | initial focus | open=true で children に focusable（`<a href>` / `<button>`）を含めて render | drawer 内最初の focusable が `document.activeElement` になる | AC-7 |
| T-DR-9 | `md:hidden` overlay | open=true で render | overlay（`[data-component="shell-drawer-overlay"]`）の className に `md:hidden` を含む | INV-5 |

注記:
- Esc は `document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))` で発火。`browserDocument()` 経由 listener が登録される設計（Phase 2）に対応。
- focus は jsdom で `element.focus()` が `activeElement` に反映される。children に focusable が無い場合の T-DR-8 は適用外（focusable を必ず含めて render）。
- `afterEach` で `cleanup()` + `document.body.removeAttribute("data-shell-drawer-open")` を実行し、テスト間の body 属性リークを防ぐ。

---

## 3. `useSidebarState.spec.tsx`（編集）

### 必須: `next/navigation` mock の追加

`useSidebarState` は Phase 5 で `usePathname()`（`next/navigation`）を import する。jsdom には Next.js の router context が無いため、mock を追加しないと **既存の `renderHook` テスト全件が `usePathname` 呼び出しで落ちる**。ファイル冒頭（import より前）に以下を追加する:

```tsx
import { vi } from "vitest";

const pathnameRef = { current: "/" };
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameRef.current,
}));
```

route 変化を再現するテストでは `pathnameRef.current` を書き換えてから `rerender()` する（`vi.mock` factory は hoist されるため module-scope の可変参照を経由する）。

### matchMedia mock の方針（FB-VSCPKR-02 順守）

md 初期 collapsed 判定は `window.matchMedia` を参照する。jsdom は `matchMedia` を実装しないため mock が必要。**`vi.stubGlobal("window", ...)` は禁止（FB-VSCPKR-02）**。`Object.defineProperty(window, "matchMedia", { ... })` で `matchMedia` のみを差し替える:

```tsx
function mockMatchMedia(matcher: (query: string) => boolean): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: matcher(query),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }),
  });
}
```

- md viewport: `matcher = (q) => q.includes("768") /* min-width:768 true */ && !q.includes("1024")` のように `(min-width: 768px)` を true、`(min-width: 1024px)` を false にする。
- lg viewport: 両クエリ true。
- `afterEach` で `Reflect.deleteProperty(window, "matchMedia")` 相当（または再定義）で後始末し、テスト間リークを防ぐ。

### テストケース

| # | ケース | 前提 | 操作 | 期待 | AC |
|---|--------|------|------|------|----|
| T-SS-1（既存維持） | localStorage 空で expanded | `matchMedia` mock を lg（両 true）に設定 | `renderHook` | `mode === "expanded"` / `drawerOpen === false` | 回帰 |
| T-SS-2（既存維持） | toggle で flip + 永続化 | — | `act(toggleCollapsed)` | `mode` 反転 + `localStorage` 値更新 | 回帰 |
| T-SS-3（既存維持） | localStorage true で collapsed | `localStorage[KEY]="true"` | `renderHook` | `mode === "collapsed"` | AC-8 |
| T-SS-4（既存維持） | setDrawerOpen 反映 | — | `act(setDrawerOpen(true/false))` | `drawerOpen` 追従 | 回帰 |
| T-SS-5（既存維持） | 破損値で expanded fallback | `localStorage[KEY]="garbage"` | `renderHook` | `mode === "expanded"` | AC-8 |
| T-SS-6（新規） | md 初回 collapsed | localStorage 空 + `matchMedia` mock md | `renderHook` | mount 後 `mode === "collapsed"` | AC-8 |
| T-SS-7（新規） | lg 初回 expanded | localStorage 空 + `matchMedia` mock lg | `renderHook` | mount 後 `mode === "expanded"` | AC-8 |
| T-SS-8（新規） | localStorage 優先（md でも localStorage 勝ち） | `localStorage[KEY]="false"` + `matchMedia` mock md | `renderHook` | `mode === "expanded"`（matchMedia より localStorage 優先） | AC-8 |
| T-SS-9（新規） | route 変化で drawer auto-close | `setDrawerOpen(true)` 後 `pathnameRef.current = "/profile"` | `rerender()` | `drawerOpen === false` | AC-5 |
| T-SS-10（新規） | 同一 route では auto-close しない | `setDrawerOpen(true)` 後 pathname 不変 | `rerender()` | `drawerOpen === true`（依存配列 `[pathname]` で初回 mount 後の同値再評価では close しない設計を確認） | AC-5 / 回帰 |

> 既存テストの `beforeEach`/`afterEach` の `window.localStorage.clear()` は維持し、`matchMedia` mock のセット/解除を追加する。

---

## 4. `SidebarShell.spec.tsx`（編集・mount 統合の回帰 1 件）

既存テストは維持。`SidebarMobileTrigger` / `SidebarDrawer` の mount を確認する回帰を 1 件追加する（mount 漏れ防止）。drawer は初期 `open=false` のため DOM 不在が正となる点に注意。

| # | ケース | 操作 | 期待 | AC |
|---|--------|------|------|----|
| T-SH-1（新規） | mobile trigger button が mount される | `renderShell` | `[data-component="shell-mobile-trigger-button"]`（hamburger）が存在 | AC-1/2 |
| T-SH-2（新規） | 初期は drawer 非表示 | `renderShell` | `[role="dialog"]` が存在しない（`open=false` で null） | AC-3 |

> `next/link` mock は既存ファイル冒頭にあるため流用。`SidebarShell` 経由で `useSidebarState` が `usePathname` を呼ぶため、このファイルにも `next/navigation` mock が必要になる点に注意（Phase 5 で追加）。

---

## TDD Red の期待結果

| spec | 実装前の状態 |
|------|--------------|
| `SidebarMobileTrigger.spec.tsx` | `../SidebarMobileTrigger` が不在 → **import error で全件 fail（RED）** |
| `SidebarDrawer.spec.tsx` | `../SidebarDrawer` が不在 → **import error で全件 fail（RED）** |
| `useSidebarState.spec.tsx` | `next/navigation` mock 追加後、`usePathname` 未 import の現実装では route-close ケース（T-SS-9）/ md 初期（T-SS-6/7）が fail（RED）。既存ケースは mock 追加で pass 維持 |
| `SidebarShell.spec.tsx` | hamburger button（`shell-mobile-trigger-button`）未 mount → T-SH-1 fail（RED） |

## 完了条件

- [ ] 4 spec の追加 / 編集ケースを表で列挙し各ケースに AC を紐付け
- [ ] `SidebarMobileTrigger` が context 消費（provider ラップ）であることを明記
- [ ] `SidebarDrawer` が props 駆動（open/onClose/children）であることを明記
- [ ] `useSidebarState.spec.tsx` への `next/navigation`（`usePathname`）mock 追加方針を明記
- [ ] matchMedia mock を `Object.defineProperty` で行い `vi.stubGlobal("window", ...)` を使わない（FB-VSCPKR-02）ことを明記
- [ ] 命名規則（PascalCase / `*.spec.tsx`）整合を記載
- [ ] RED の期待結果を spec ごとに記載
