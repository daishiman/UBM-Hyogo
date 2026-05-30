---
spec_classification: implementation_spec
state: spec_created
phase: 5
phase_name: 実装手順
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 5: 実装手順

## 5.1 変更対象 file (Task E core 6 + 共有 a11y 基盤 3)

Phase 1.2 参照。**実装順**は `useFocusTrap`（単一 source）→ `Drawer.tsx` refactor → SidebarDrawer 系の順とし、trap の真実を先に確定させる。

| # | path | 種別 |
|---|------|------|
| 7 | `apps/web/src/lib/a11y/useFocusTrap.ts` | 新規（**最初に実装**・5.3a） |
| 9 | `apps/web/src/components/ui/Drawer.tsx` | 編集（内部 refactor のみ・5.3b） |
| 1 | `apps/web/src/components/shell/SidebarMobileTrigger.tsx` | 新規 (Client) |
| 2 | `apps/web/src/components/shell/SidebarDrawer.tsx` | 新規 (Client) |
| 8 | `apps/web/src/lib/a11y/__tests__/useFocusTrap.spec.tsx` | 新規（Phase 6） |
| 3 | `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx` | 新規（Phase 6） |
| 4 | `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | 新規（Phase 6） |
| 5 | `apps/web/src/components/shell/SidebarShell.tsx` | 編集 |
| 6 | `apps/web/src/components/shell/useSidebarState.ts` | 編集 |

加えて scroll lock 用の global CSS 1 ルールを Task A 所有の tokens.css 同階層 CSS に追記する（5.7）。

## 5.2 Phase 5 着手 gate（P50-2）

着手前に Task A 成果物の存在を確認する。1 つでも欠けていれば Phase 5 に進まず P50-2 違反として停止する:

```bash
ls apps/web/src/components/shell/useSidebarState.ts \
   apps/web/src/components/shell/SidebarShellContext.tsx \
   apps/web/src/components/shell/SidebarShell.tsx \
   apps/web/src/components/shell/icons.tsx \
   apps/web/src/components/ui/Drawer.tsx \
   apps/web/src/lib/is-browser.ts
```

確認項目:

- `useSidebarShellContext()` が `{ mode, drawerOpen, toggleCollapsed, setDrawerOpen }` を返す。
- `SidebarShell` が `mobileTriggerSlot: ReactNode` を受け取る。
- localStorage key `ubm:shell:collapsed`、token `--shell-bar-w` / `--shell-bar-bg` 等が定義済。
- `icons.tsx` に `MenuIcon` が存在するか（無ければ 5.3 で最小追加）。
- 抽出元 `apps/web/src/components/ui/Drawer.tsx`（inline trap を持つ現行実装）と配置先 `apps/web/src/lib/a11y/`（`useAutoFocusOnMount.ts` 先例）が存在する。`useFocusTrap` は Task A 非依存の共有基盤のため、Task A 未実装でも #7 / #9 は先行実装可能。

## 5.3a `useFocusTrap.ts`（新規・単一 source・擬似コード）

`Drawer.tsx` の inline trap を**逐語抽出**する。新ロジックは足さない（既存の確立済挙動を hook 化するだけ）。

```ts
import { useEffect } from "react";
import type { RefObject } from "react";
import { browserDocument } from "@/lib/is-browser";

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * dialog の focus trap（初期 focus / Tab 境界ループ / Esc→onClose / previousFocus 復帰）。
 * SSR / 非ブラウザでは no-op（browserDocument() が undefined）。
 * Drawer.tsx / SidebarDrawer.tsx の唯一の trap source。
 */
export function useFocusTrap(
  open: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    const doc = browserDocument();
    if (!doc) return; // SSR no-op
    const previousFocus = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    const container = ref.current;
    const focusables = container
      ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => !el.hasAttribute("disabled"),
        )
      : [];
    focusables[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    doc.addEventListener("keydown", onKeyDown);
    return () => {
      doc.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose, ref]);
}
```

- selector `FOCUSABLE` は hook 内 1 定義のみ。Drawer / SidebarDrawer に再定義しない（R-E8）。
- `data-shell-drawer-open` 属性 / backdrop は dialog 共通の関心ではないため hook に含めない（SidebarDrawer 固有 chrome）。

## 5.3b `Drawer.tsx` 内部 refactor（擬似 diff・公開 API 不変）

```diff
 "use client";
-import { useEffect, useRef } from "react";
+import { useRef } from "react";
 import type { ReactNode } from "react";
-import { browserDocument } from "../../lib/is-browser";
+import { useFocusTrap } from "../../lib/a11y/useFocusTrap";

 export interface DrawerProps { open: boolean; onClose: () => void; title: string; children: ReactNode; }

 export function Drawer({ open, onClose, title, children }: DrawerProps) {
   const dialogRef = useRef<HTMLDivElement>(null);
-  useEffect(() => { /* 旧 inline trap（previousFocus / 初期 focus / Tab ループ / Esc）約 40 行 */ }, [open, onClose]);
+  useFocusTrap(open, onClose, dialogRef);
   if (!open) return null;
   return (
     <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
       <h2 id="drawer-title">{title}</h2>
       {children}
     </div>
   );
 }
```

- 公開 props `{ open, onClose, title, children }` と DOM（`role`/`aria-modal`/`aria-labelledby`/`<h2>`）は不変。
- 既存 consumer（`MemberDrawer` / `BulkRepublishDrawer`）と `primitives.component.spec.tsx` は無改修（R-E7）。

## 5.3 `SidebarMobileTrigger.tsx`（新規 Client・擬似コード）

```tsx
"use client";
import { useSidebarShellContext } from "./SidebarShellContext";
import { MenuIcon } from "./icons"; // 無ければ icons.tsx に hamburger svg を最小追加

export function SidebarMobileTrigger(): JSX.Element {
  const { setDrawerOpen } = useSidebarShellContext();
  return (
    <button
      type="button"
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

- 自前 state 禁止（I-E2）。render 時に副作用を起こさない（`onClick` のみで `setDrawerOpen` を呼ぶ）。
- `MenuIcon` が `icons.tsx` に未定義なら、Task A 既存 icon と同一スタイル（`stroke="currentColor"` / `aria-hidden` 受け取り）で hamburger svg を最小追加。色は `currentColor` 経由（HEX 禁止 / I-E4）。

## 5.4 `SidebarDrawer.tsx`（新規 Client・擬似コード）

```tsx
"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { browserDocument } from "@/lib/is-browser";

export type SidebarDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function SidebarDrawer({ open, onClose, children }: SidebarDrawerProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // focus trap（初期 focus / Tab ループ / Esc→onClose / previousFocus）は単一 source へ委譲（I-E6）
  useFocusTrap(open, onClose, dialogRef); // AC-E4 / AC-E6

  // scroll lock は SidebarDrawer 固有 chrome。属性 + CSS（5.7）で SSR 安全に（AC-E5）
  useEffect(() => {
    if (!open) return;
    const doc = browserDocument();
    if (!doc) return;
    doc.body.setAttribute("data-shell-drawer-open", "true");
    return () => doc.body.removeAttribute("data-shell-drawer-open");
  }, [open]);

  if (!open) return null; // AC-E11 / unmount

  return (
    <div className="md:hidden fixed inset-0 z-50">
      {/* backdrop: onClick のみ・aria-hidden（AC-E4 / R-E5） */}
      <div
        className="absolute inset-0 bg-[var(--shell-overlay,oklch(0%_0_0_/_0.4))]"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* panel: backdrop の兄弟。click 伝播せず（stopPropagation 不要） */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="サイドバーメニュー"
        className="absolute inset-y-0 left-0 flex w-[var(--shell-bar-w)] flex-col bg-[var(--shell-bar-bg)]"
      >
        {children}
      </div>
    </div>
  );
}
```

- focus trap は `useFocusTrap`（5.3a）に委譲し、SidebarDrawer に trap を再実装しない（I-E6・複製ゼロ）。`Drawer.tsx` も同 hook を使うため挙動が画面間で乖離しない。
- SidebarDrawer 固有の chrome は (a) scroll lock の `data-shell-drawer-open` 属性、(b) backdrop click、(c) `md:hidden` wrapper、(d) token 幅・背景 のみ。
- backdrop の半透明色は token 経由 + oklch fallback（HEX 禁止 / I-E4）。実 token（`--shell-overlay` 等）が Task A に無い場合は fallback の oklch だけで成立させる。
- `onClose` を `useFocusTrap` の effect 依存に渡すため、呼び出し側（`SidebarShell`）は `onClose` を安定参照（`useCallback` 推奨）で渡す。

## 5.5 `SidebarShell.tsx` 編集（擬似 diff）

```diff
 "use client";
 import { useSidebarShellContext } from "./SidebarShellContext";
+import { SidebarDrawer } from "./SidebarDrawer";
+import { useCallback } from "react";
 ...
 export function SidebarShell({ mobileTriggerSlot, children, ... }: SidebarShellProps) {
-  const { mode, toggleCollapsed } = useSidebarShellContext();
+  const { mode, drawerOpen, setDrawerOpen, toggleCollapsed } = useSidebarShellContext();
+  const closeDrawer = useCallback(() => setDrawerOpen(false), [setDrawerOpen]);
+
+  // <aside> 内と drawer 内で共有する nav ツリーを 1 変数化（重複 component 定義を避ける）
+  const sidebarTree = (
+    <>
+      {/* SidebarBrand + SidebarNav + UserMenu（Task A / B 提供）を既存どおり構成 */}
+      {/* ※ 重複しうる固定 id は置かない（R-E2） */}
+    </>
+  );
   return (
     <div className="...">
-      <aside className="flex ...">
+      {/* sm: 非表示・md+: flex 表示（AC-E1） */}
+      <aside className="hidden md:flex ...">
-        {/* nav ツリー直書き */}
+        {sidebarTree}
       </aside>
+
+      {/* sm のみ visible な上部 56px ストリップ（AC-E1） */}
+      <div className="md:hidden flex h-14 items-center px-2">
+        {mobileTriggerSlot}
+      </div>
+
+      {/* overlay drawer（sm のみ・md+ で unmount は SidebarDrawer 内 md:hidden + open 制御） */}
+      <SidebarDrawer open={drawerOpen} onClose={closeDrawer}>
+        {sidebarTree}
+      </SidebarDrawer>
+
       <main className="...">{children}</main>
     </div>
   );
 }
```

- `mobileTriggerSlot` には呼び出し側 layout（Task C / D）が `<SidebarMobileTrigger />` を渡す前提。layout の呼び出しシグネチャは変えない（I-E1 / Phase 3.2）。
- ストリップの高さ 56px（`h-14`）は responsive マトリクス（Phase 2.1）の正本値。

## 5.6 `useSidebarState.ts` 編集（擬似 diff）

```diff
 "use client";
-import { useState } from "react";
+import { useEffect, useState } from "react";
+import { usePathname } from "next/navigation";
+import { browserDocument } from "@/lib/is-browser";
 ...
 export function useSidebarState(): SidebarState {
   const [mode, setMode] = useState<SidebarStateMode>(() => readPersistedMode());
   const [drawerOpen, setDrawerOpen] = useState(false);
+
+  // (a) route 変化で drawer 自動 close（AC-E7 / AC-E8）
+  const pathname = usePathname();
+  useEffect(() => {
+    setDrawerOpen(false);
+  }, [pathname]);
+
+  // (b) 初回マウントで初期 collapsed 判定（AC-E9 / AC-E10）— 1 回限り・resize 非追従
+  useEffect(() => {
+    if (hasPersistedMode()) return;                       // localStorage 優先
+    const doc = browserDocument();
+    const view = doc?.defaultView;
+    if (!view?.matchMedia) return;                         // SSR / 非対応は no-op（expanded fallback）
+    const isLg = view.matchMedia("(min-width: 1024px)").matches;
+    setMode(isLg ? "expanded" : "collapsed");              // < 1024px は collapsed、>= 1024px は expanded
+  }, []);                                                  // 依存空配列 = 初回のみ（AC-E10）
   ...
   return { mode, drawerOpen, toggleCollapsed, setDrawerOpen };
 }
```

- 戻り値 shape は不変（I-E1）。挙動追加のみ。
- `hasPersistedMode()` / `readPersistedMode()` は Task A の永続化ヘルパを再利用。未提供なら `useSidebarState.ts` 内に閉じた最小 helper（`localStorage.getItem('ubm:shell:collapsed')` の有無判定）を追加し、外部 export しない。
- `matchMedia` 参照は (b) の初回 effect 1 回限り。resize listener は設けない（I-E5）。

## 5.7 scroll lock CSS 追加（Task A 所有 tokens.css 同階層）

`apps/web/src/styles/` 配下の global CSS（tokens.css と同階層・import 済の global stylesheet）に追記:

```css
body[data-shell-drawer-open="true"] {
  overflow: hidden;
}
```

- JS で `body.style.overflow` を直接操作しない（R-E4・hydration mismatch 回避）。属性 + CSS で実現。
- tokens.css 自体は Task A 所有のため、Task E は当該 1 ルールの追記に留める。

## 5.8 入力・出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | context（`drawerOpen` / `setDrawerOpen`）、`usePathname()`、`matchMedia('(min-width:1024px)')`、localStorage `ubm:shell:collapsed` |
| 出力 | sm の overlay drawer DOM（`role="dialog"`）、md+ の `<aside>` 表示、hamburger trigger |
| 副作用 | `document.body` への `data-shell-drawer-open` 属性付与/除去、localStorage 読み取りのみ（書き込みは Task A toggle 経由）。API / D1 / fetch なし（I-E3） |
| エラーハンドリング | SSR / 非ブラウザで `browserDocument()` が null → effect 全体 no-op（expanded fallback）。`matchMedia` 非対応も early return |

## 5.9 ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web dev   # 375 / 768 / 1280px を目視
```

## 5.10 変更粒度・コミット方針

Task E core 6 file + 共有 a11y 基盤 3 file（`useFocusTrap.ts` / `useFocusTrap.spec.tsx` / `Drawer.tsx` refactor）+ scroll lock CSS 1 ルールを 1 つの論理単位として扱う。`useFocusTrap` + `Drawer.tsx` refactor は Task A 非依存のため先行コミット可能だが、本 task では同一論理単位として 1 PR にまとめる。
commit / push / PR は Phase 13 user approval 後にのみ実行する。
