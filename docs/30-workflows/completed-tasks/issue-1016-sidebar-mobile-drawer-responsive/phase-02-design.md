# Phase 2 — 設計

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 再利用 | 対象 | 備考 |
|--------|------|------|
| ✅ | `useSidebarShellContext()`（`SidebarShellContext.tsx`） | `drawerOpen` / `setDrawerOpen` / `mode` を既に公開済。新規 context 不要 |
| ✅ | `SidebarBrand` / `SidebarNav` / `DefaultUserChip`（`SidebarShell.tsx` 内） | drawer 内に同ツリーを描画 |
| ✅ | `@/lib/is-browser` の `isBrowser()` / `browserDocument()` | focus / matchMedia の境界 |
| ✅ | 既存 `getBrowserStorage()`（`useSidebarState.ts` 内 private） | storage 参照 |
| 🆕 | `SidebarMobileTrigger` / `SidebarDrawer` | 既存に該当なし。新規追加が必要 |

## 状態所有権（責務境界）

| 状態 | 所有者 | 備考 |
|------|--------|------|
| `mode`（expanded/collapsed） | `useSidebarState`（既存） | localStorage 永続 + md 初期判定を追記 |
| `drawerOpen` | `useSidebarState`（既存） | route 変化 auto-close を追記 |
| body scroll lock（`data-shell-drawer-open`） | `SidebarDrawer`（open prop の副作用） | useEffect で body 属性 toggle |
| initial focus | `SidebarDrawer`（open 遷移時） | drawer 内最初の focusable |

> drawer の close（`useSidebarState.setDrawerOpen(false)`）と Task B の UserMenu `<details>` close は **別 state**。重複させない（元 Task E リスク表）。

## 因果ループ（hydration mismatch 回避）

- SSR では `window` 不在 → `useSidebarState` の初期 state は常に `collapsed=false`（expanded）でレンダリング。
- mount 後 `useEffect` で `readInitialState()` を実行し、localStorage / matchMedia から確定値へ更新。
- これにより SSR HTML と初回 client HTML が一致（mismatch 回避）。breakpoint の見た目自体は CSS（`hidden md:flex` 等）が即時担保するため、JS 確定が 1 tick 遅れても視覚的破綻はない。

## コンポーネント設計

### 1. `SidebarMobileTrigger.tsx`（新規・Client）

```tsx
"use client";
import { useSidebarShellContext } from "./SidebarShellContext";
import { MenuIcon } from "./icons"; // 既存 icons.tsx に hamburger があれば再利用、なければ追加

export function SidebarMobileTrigger(): JSX.Element {
  const { drawerOpen, setDrawerOpen } = useSidebarShellContext();
  return (
    <button
      type="button"
      data-component="shell-mobile-trigger-button"
      aria-label="メニューを開く"
      aria-controls="shell-drawer"
      aria-expanded={drawerOpen}
      onClick={() => setDrawerOpen(true)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--ubm-color-text-primary)] md:hidden"
    >
      {/* hamburger icon (aria-hidden) */}
    </button>
  );
}
```

- 入力: なし（context 消費）
- 出力: hamburger `<button>`
- 副作用: click で `setDrawerOpen(true)`
- `md:hidden` で `>=768px` は非表示。

### 2. `SidebarDrawer.tsx`（新規・Client）

```tsx
"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { browserDocument } from "@/lib/is-browser";

export type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode; // brand + nav + footer の同ツリー
};

export function SidebarDrawer({ open, onClose, children }: SidebarDrawerProps): JSX.Element | null {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // body scroll lock（AC-6）
  useEffect(() => {
    const doc = browserDocument();
    if (!doc) return;
    if (open) doc.body.setAttribute("data-shell-drawer-open", "true");
    else doc.body.removeAttribute("data-shell-drawer-open");
    return () => doc.body.removeAttribute("data-shell-drawer-open");
  }, [open]);

  // initial focus（AC-7）
  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    first?.focus();
  }, [open]);

  // Esc close（AC-4）
  useEffect(() => {
    if (!open) return;
    const doc = browserDocument();
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    doc.addEventListener("keydown", onKey);
    return () => doc.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div data-component="shell-drawer-overlay" className="fixed inset-0 z-50 md:hidden">
      <div
        data-component="shell-drawer-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--ubm-color-overlay-scrim)]"
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id="shell-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="ナビゲーション"
        data-component="shell-drawer-panel"
        className="absolute inset-y-0 left-0 flex w-[var(--shell-bar-w)] flex-col gap-3 bg-[var(--shell-bar-bg)] p-3 shadow-lg"
      >
        {children}
      </div>
    </div>
  );
}
```

- 入力: `open` / `onClose` / `children`
- 出力: open=false で `null`、open=true で dialog overlay
- 副作用: body 属性 toggle / focus / keydown listener（全て cleanup あり）
- backdrop は `aria-hidden`、panel が `role="dialog"`。
- `--ubm-color-overlay-scrim` が tokens.css に未定義の場合は Phase 5 で既存の scrim トークン（例 `--ubm-color-surface-overlay` 等）を確認して採用。HEX 直書き禁止（INV-2）。

### 3. `useSidebarState.ts`（編集）

追記内容:

```tsx
import { usePathname } from "next/navigation";
// ... 既存 import

// 初期 collapsed 判定（localStorage 優先 → md のみ collapsed）
function readInitialCollapsed(): boolean {
  const ls = getBrowserStorage();
  if (ls) {
    const raw = ls.getItem(STORAGE_KEY);
    if (raw !== null) {
      try { return JSON.parse(raw) === true; } catch { /* fallthrough */ }
    }
  }
  // localStorage 未設定 → md（>=768 && <1024）なら collapsed
  if (!isBrowser()) return false;
  try {
    const mdUp = window.matchMedia("(min-width: 768px)").matches;
    const lgUp = window.matchMedia("(min-width: 1024px)").matches;
    return mdUp && !lgUp;
  } catch {
    return false;
  }
}

export function useSidebarState() {
  // ... 既存 collapsed / drawerOpen state
  const pathname = usePathname();

  // route 変化で drawer auto-close（AC-5）
  useEffect(() => {
    setDrawerOpenState(false);
  }, [pathname]);

  // ... 既存 return
}
```

- `usePathname()` は `next/navigation`。SSR/client 両対応。
- `isBrowser()` ガード後に `window.matchMedia` を呼ぶ（INV-3）。`is-browser.ts` の直接 `window` 制約に抵触する場合は Phase 5 で `isBrowser()` ガード + scoped `// eslint-disable-next-line no-restricted-globals` を 1 行に限定して付与する（既存 `getBrowserStorage()` の `"local"+"Storage"` 回避と同方針）。

### 4. `SidebarShell.tsx`（編集）

`mobileTriggerSlot` 描画ブロックを mobile strip 化し、`SidebarMobileTrigger` と `SidebarDrawer` を追加:

```tsx
import { SidebarMobileTrigger } from "./SidebarMobileTrigger";
import { SidebarDrawer } from "./SidebarDrawer";

// provider 内 return JSX:
//  - mobile strip（md:hidden）: <SidebarMobileTrigger /> + {mobileTriggerSlot}
//  - <SidebarDrawer open={state.drawerOpen} onClose={() => state.setDrawerOpen(false)}>
//      <SidebarBrand /> + <SidebarNav navGroups activePath /> + footer(userMenuSlot/DefaultUserChip)
//    </SidebarDrawer>
```

- drawer の children は `<aside>` と同じツリー（brand + nav + footer）。重複は Phase 8 で内部 helper（例 `SidebarBody`）抽出を検討（必須ではない）。
- `<aside>` の `hidden md:flex` は維持（`<768px` で sidebar hidden）。

## responsive 契約（CSS 正本）

| viewport | sidebar `<aside>` | drawer | hamburger |
|---------|------------------|--------|-----------|
| `<768px`（sm） | hidden（`hidden md:flex`） | open 可（`md:hidden`） | visible（mobile strip） |
| `768〜1023px`（md） | visible・**初期 collapsed**（matchMedia） | `md:hidden` で不可視 | hidden（`md:hidden`） |
| `>=1024px`（lg） | visible・初期 expanded（localStorage 優先） | `md:hidden` で不可視 | hidden |

## state 引き渡し（UI 統合境界）

| from | to | 項目 |
|------|----|----|
| `useSidebarState` | `SidebarShellProvider` value | `drawerOpen` / `setDrawerOpen` / `mode` / `toggleCollapsed`（既存） |
| context | `SidebarMobileTrigger` | `drawerOpen`（aria-expanded）/ `setDrawerOpen` |
| `SidebarShell` | `SidebarDrawer` | `open` / `onClose` / `children` |

## ライブラリ選定

- focus trap 外部ライブラリは**追加しない**（元 Task E リスク表「focus trap 過剰実装回避」）。initial focus + Esc + backdrop close の最小実装に限定。

## 完了条件

- [ ] 4 ファイルのシグネチャを確定
- [ ] 状態所有権・責務境界を明記
- [ ] responsive 契約表を確定
- [ ] hydration mismatch 回避方針を明記
