---
spec_classification: implementation_spec
state: spec_created
phase: 2
phase_name: 設計
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 2: 設計

## 2.1 responsive マトリクス（正本）

| viewport | sidebar `<aside>` | drawer | hamburger trigger | 実現手段 |
|---------|--------|--------|-----------|---------|
| `< 768px`（sm） | hidden | available（overlay） | visible（上部 56px ストリップ） | `<aside class="hidden md:flex">` + drawer `md:hidden` + trigger `md:hidden`（= sm のみ visible） |
| `768〜1023px`（md） | visible（**初期 collapsed**） | unmounted | hidden | CSS `md:flex` で表示 + `useSidebarState` 初期 collapsed 判定 + trigger は `md:hidden` |
| `>= 1024px`（lg） | visible（**初期 expanded**、localStorage 優先） | unmounted | hidden | CSS 表示 + 初期 expanded + trigger `md:hidden` |

> trigger の visible 範囲は「sm のみ」。Tailwind では `md:hidden`（= md 以上で hidden、sm では visible）で表現する。drawer も `md:hidden`（sm のみ overlay 可能）。

## 2.2 `SidebarMobileTrigger.tsx`（新規 Client）

```tsx
"use client";
import { useSidebarShellContext } from "./SidebarShellContext";

export function SidebarMobileTrigger(): JSX.Element {
  const { setDrawerOpen } = useSidebarShellContext();
  return (
    <button
      type="button"
      // md 以上で hidden（= sm のみ表示）。56px ストリップ内に置かれる前提
      className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--shell-fg)]"
      aria-label="メニューを開く"
      aria-haspopup="dialog"
      onClick={() => setDrawerOpen(true)}
    >
      <MenuIcon aria-hidden="true" />
    </button>
  );
}
```

- state は持たない。`setDrawerOpen(true)` のみ呼ぶ（I-E2）。
- `MenuIcon` は Task A の `apps/web/src/components/shell/icons.tsx` から import（hamburger svg）。未定義なら icons.tsx に `MenuIcon` を最小追加（Phase 8 参照）。
- `useSidebarShellContext` は Task A `SidebarShellContext.tsx` の公開 hook（`{ mode, drawerOpen, toggleCollapsed, setDrawerOpen }` を返す前提）。

## 2.3 `SidebarDrawer.tsx`（新規 Client）

```tsx
"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { browserDocument } from "@/lib/is-browser";

export type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode; // sidebar 本体（brand + nav + UserMenu）と同じツリーを渡す
};

export function SidebarDrawer(props: SidebarDrawerProps): JSX.Element | null;
```

### 2.3.1 レンダリング契約

- `open === false` のとき `null` を返す（unmount）。
- ラッパは `md:hidden`（md 以上では overlay を出さない、I-E5 / AC-E11）。
- 構造:
  - backdrop `<div>`（`onClick={onClose}`、`aria-hidden="true"`、半透明 `bg-[color-mix...]` 等は token 経由）
  - panel `<div ref={dialogRef} role="dialog" aria-modal="true" aria-label="サイドバーメニュー">` 内に `{children}`
- 幅は `var(--shell-bar-w)`（Task A token）を流用。背景は `var(--shell-bar-bg)`。

### 2.3.2 focus trap / Esc（I-E6: `useFocusTrap` hook 委譲・単一 source）

focus trap は **`apps/web/src/lib/a11y/useFocusTrap.ts` へ委譲**する。SidebarDrawer 自身は trap を再実装しない。

```ts
// useFocusTrap.ts（Drawer.tsx の inline trap を逐語抽出した単一 source）
export function useFocusTrap(
  open: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>,
): void;
// 内部: open 時に previousFocus 保存 → ref 内最初の focusable へ focus →
//       keydown(Escape→onClose / Tab→先頭・末尾ループ) → cleanup で previousFocus 復帰。
//       browserDocument() で SSR 安全（doc=undefined なら no-op）。
```

SidebarDrawer は `useFocusTrap(open, onClose, dialogRef)` を呼ぶだけで、初期 focus / Tab ループ / Esc / previousFocus 復帰を得る（AC-E4 / AC-E6）。

SidebarDrawer 固有の chrome（hook の**外側**で実装）:

1. scroll lock: `body[data-shell-drawer-open="true"]` 属性を別 `useEffect(open)` で付与/除去（AC-E5）。属性 + CSS 方式（2.3.3）で `body.style` を直接触らない。
2. backdrop click → `onClose`（2.3.4 / AC-E4）。
3. wrapper の `md:hidden` と panel の token 幅・背景（2.3 / I-E4）。

> 既存 `Drawer.tsx` も同 hook 経由に内部 refactor し、trap の真実を 1 箇所へ集約する（公開 API・DOM 出力は不変）。`data-shell-drawer-open` 属性は dialog 共通の関心ではなく SidebarDrawer 固有のため hook に含めず外側に置く。

### 2.3.3 scroll lock（CSS）

`tokens.css` 起点の global CSS（`apps/web/src/styles/` 配下、Task A が tokens.css を所有）に:

```css
body[data-shell-drawer-open="true"] {
  overflow: hidden;
}
```

を追加（AC-E5 / DoD 3）。JS で `body.style` を直接書かず、属性 + CSS で実現する。

### 2.3.4 backdrop click

backdrop `<div>` の `onClick={onClose}`。panel への click は `stopPropagation` 不要（panel は backdrop の兄弟。backdrop だけに onClick を付け、panel click は backdrop に伝播しない構造にする）。

## 2.4 `SidebarShell.tsx` 編集設計

Task A が定義する `SidebarShell`（`mobileTriggerSlot: ReactNode` を受け取る）に対し、Task E は以下を追加する:

1. `<aside>` の class を `hidden md:flex ...`（sm で hidden、md+ で flex 表示）に変更（AC-E1）。
2. `mobileTriggerSlot` を上部 56px ストリップ内に配置（sm のみ visible なストリップ。`md:hidden` を付与した header 帯）。
3. drawer を mount: `useSidebarShellContext()` から `drawerOpen` / `setDrawerOpen` を読み、

```tsx
<SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
  {/* <aside> と同じ nav ツリー（SidebarBrand + SidebarNav + UserMenu）を渡す */}
  {sidebarTree}
</SidebarDrawer>
```

- `sidebarTree` は `<aside>` 内と drawer 内で共有する JSX（重複描画でなく同一 component ツリーを変数化）。

## 2.5 `useSidebarState.ts` 編集設計

Task A の戻り値 `{ mode, drawerOpen, toggleCollapsed, setDrawerOpen }` を維持しつつ、以下 2 挙動を追加:

### 2.5.1 route 変化で drawer 自動 close（AC-E7）

```ts
import { usePathname } from "next/navigation";
// ...
const pathname = usePathname();
useEffect(() => {
  setDrawerOpen(false);
}, [pathname]);
```

- `pathname` 変化のたび drawer を閉じる。初回マウント時も `drawerOpen` の初期値 false と整合（副作用なし）。

### 2.5.2 初期 collapsed 判定（AC-E9 / AC-E10）

初回マウント時に 1 回だけ viewport を判定:

```ts
const [mode, setMode] = useState<SidebarStateMode>(() => readPersistedMode()); // SSR 安全（既存 Task A）
useEffect(() => {
  // localStorage に明示値があればそれを優先（Task A 既存）。未設定時のみ viewport 既定を適用。
  if (hasPersistedMode()) return;
  const doc = browserDocument();
  if (!doc?.defaultView?.matchMedia) return;          // SSR / 非対応は no-op（expanded fallback）
  const isLg = doc.defaultView.matchMedia("(min-width: 1024px)").matches;
  setMode(isLg ? "expanded" : "collapsed");           // md~lg は collapsed、lg+ は expanded
}, []); // 依存空配列 = 初回のみ。resize 追従しない（I-E5）
```

- `matchMedia` 参照は初回 effect の 1 回限り（AC-E10）。SSR では `browserDocument()` が null を返し未参照（既存 `is-browser.ts` パターン）。
- localStorage に `ubm:shell:collapsed` が既にある場合は viewport 既定より優先（Task A の永続化を尊重、AC-E9 の「localStorage 優先」）。
- `hasPersistedMode()` / `readPersistedMode()` は Task A の永続化ヘルパを再利用（無ければ最小 helper を `useSidebarState.ts` 内に閉じて追加。Phase 5 参照）。

## 2.6 token / CSS 使用（I-E4）

- 新規 token は原則追加しない。Task A 追加の `--shell-bar-w` / `--shell-bar-bg` / `--shell-bar-border` / `--shell-fg`（無ければ `--shell-bar-*` から流用）を使用。
- backdrop の半透明色は token 経由（例 `bg-[var(--shell-overlay,oklch(0%_0_0_/_0.4))]` の fallback 付き。HEX 直書き禁止）。fallback 値も oklch で記述し HEX を使わない。
- scroll lock の `body[data-shell-drawer-open]` ルールは tokens.css と同階層の global CSS に置く。

## 2.7 DOM 契約サマリ

| 要素 | 属性 / class | 根拠 AC |
|------|-------------|---------|
| `<aside>` | `hidden md:flex` | AC-E1 |
| trigger `<button>` | `md:hidden`、`aria-label="メニューを開く"`、`aria-haspopup="dialog"` | AC-E1 / AC-E2 |
| drawer wrapper | `md:hidden`、`open=false` で null | AC-E11 |
| drawer panel | `role="dialog"`、`aria-modal="true"`、`aria-label="サイドバーメニュー"` | AC-E3 |
| backdrop | `onClick=onClose`、`aria-hidden="true"` | AC-E4 |
| `<body>` | drawer open 時 `data-shell-drawer-open="true"` | AC-E5 |
