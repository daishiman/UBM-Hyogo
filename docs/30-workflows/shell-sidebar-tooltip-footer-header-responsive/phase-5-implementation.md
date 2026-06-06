---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 5
phase_name: 実装手順
created_at: 2026-06-03
task_type: implementation
visual_category: VISUAL
implementation_mode: new
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
---

# Phase 5: 実装手順

Phase 2（設計）/ Phase 3（D-1〜D-7 resolved）を実コード差分へ展開する。レーン A（ツールチップ）→ C（mobile-bar class）→ B（footer CSS）の順で実装するが、**1 サイクル / 1 PR**（CONST_007）で完了する。各ステップ後に typecheck / lint / focused vitest を回す。

## 5.0 着手前 gate（必須・実行してから着手）

### 5.0.1 token 実在確認（AC-A4 / AC-B3）

着手時に使用 token が `tokens.css` に実在することを grep で確認する。未定義 token があれば fallback 値を併記する（`var(--x, fallback)`）。

```bash
grep -nE "\-\-ubm-(space-1|space-2|radius-sm|color-surface-panel|color-surface-bg|color-border-default|color-text-primary|shadow-md|dur-fast|text-xs)\b" apps/web/src/styles/tokens.css
```

確認済（Phase 4 調査時点の `tokens.css`）:

| token | 実値 | 用途 |
|-------|------|------|
| `--ubm-space-1` | `4px` | tooltip padding（縦） |
| `--ubm-space-2` | `8px` | tooltip padding（横）/ 左オフセット |
| `--ubm-radius-sm` | `8px` | tooltip 角丸 |
| `--ubm-color-surface-panel` | `#ffffff` | tooltip 背景 |
| `--ubm-color-surface-bg` | `#f5f4f1` | **footer 背景**（レーン B） |
| `--ubm-color-border-default` | `#e7e5df` | tooltip 枠線 |
| `--ubm-color-text-primary` | `#1a1917` | tooltip 文字色 |
| `--ubm-shadow-md` | 多段 shadow | tooltip 影 |
| `--ubm-dur-fast` | `120ms` | tooltip transition |
| `--ubm-text-xs` | `11px` | tooltip font-size（fallback `12px` 併記） |

> いずれも実在するため fallback は `--ubm-text-xs` のみ `var(--ubm-text-xs, 12px)` として保険併記する（Phase 2 §2.1.3 の方針踏襲）。`z-index` / `opacity` / `space` は色 token ではないため `verify-design-tokens` の HEX 検査対象外。

### 5.0.2 overflow 確認（レーン B 前提・sticky footer が効くか）

footer の sticky は最近接スクロール祖先基準。祖先に `overflow: hidden` / `overflow: clip` があると sticky 範囲がそこへ限定される。footer の祖先（`shell-root` / `div.flex-1.flex-col` / `main`）に overflow 制限が**無い**ことを grep 確認する。

```bash
# SidebarShell.tsx の各コンテナ className に overflow 制限が無いことを確認
grep -nE "overflow" apps/web/src/components/shell/SidebarShell.tsx
```

確認済（automation-30 review cycle 補正後）: `<aside data-shell="sidebar">` は collapsed tooltip を外側へ出すため `overflow-visible`。`SidebarNav` は expanded では `overflow-y-auto`、collapsed では tooltip 横展開を優先して `overflow-visible`。`div.flex-1.flex-col` / `main` / `data-shell-root` に overflow 指定は無い → sticky footer は body をスクロール祖先として成立し、tooltip も sidebar 外へ表示できる。**この前提が崩れていたら（祖先に overflow が増えていたら）レーン B / tooltip の実装方針を Phase 8 で再検討する**。

## 5.1 変更対象ファイル一覧（CONST_005）

### 新規（2）

| # | path | レーン | 種別 |
|---|------|--------|------|
| 1 | `apps/web/src/components/shell/SidebarTooltip.tsx` | A | 新規 Client component |
| 2 | `apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx` | A | 新規 test（Phase 4 §4.2） |

### 編集（コード 6 / CSS 2 / test 4）

| # | path | レーン | 種別 |
|---|------|--------|------|
| 3 | `apps/web/src/components/shell/SidebarNavItem.tsx` | A | 編集（collapsed で tooltip wrap） |
| 4 | `apps/web/src/components/shell/SidebarUserMenu.tsx` | A | 編集（summary 内 tooltip バブル・D-3） |
| 5 | `apps/web/src/components/shell/SidebarCollapseToggle.tsx` | A | 編集（collapsed で tooltip wrap） |
| 6 | `apps/web/src/components/shell/SidebarShell.tsx` | A + C | 編集（AdminPublicReturn tooltip / mobile-bar sticky） |
| 7 | `apps/web/src/styles/globals.css` | A | 編集（tooltip CSS・shell セクション） |
| 8 | `apps/web/src/styles/legacy-public.css` | B | 編集（public-footer sticky bottom） |
| 9 | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | A | 編集（append・Phase 4 §4.3） |
| 10 | `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | A + C | 編集（append・Phase 4 §4.4） |
| 11 | `apps/web/src/components/shell/__tests__/SidebarCollapseToggle.spec.tsx` | A | 新規（Phase 4 §4.5） |
| 12 | `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | A | 編集（append・Phase 4 §4.6） |

> test ファイル（#2 / #9-12）は Phase 4 で設計済。Phase 5 では production コード（#1 / #3-8）を実装し、Phase 4 の RED を GREEN にする。Phase 6 で fail-path / 回帰 / axe を追加する。

## 5.2 関数・型シグネチャ / 入出力・副作用 / エラーハンドリング

| 項目 | 内容 |
|------|------|
| 公開シグネチャ | `SidebarTooltip(props: SidebarTooltipProps): ReactElement`（§5.3）。既存 component の props シグネチャは不変（編集はレンダリングと className のみ） |
| 入力 | `collapsed: boolean`（prop 由来・I-5）/ `label: string` / `children: ReactElement`（単一 trigger 要素） |
| 出力 | collapsed=true: `<span.ubm-shell-tooltip-wrap>{trigger(aria-describedby 注入)}{<span role=tooltip>}</span>` / collapsed=false: children 直返し |
| 副作用 | **なし**（新規 JS state を持たない・I-4）。`useId()` は副作用ではなく純粋な id 生成。API / D1 / fetch / localStorage いずれも触らない（I-1） |
| エラーハンドリング | `children` が単一 React 要素でない場合 `cloneElement` が失敗しうる → 呼出側は必ず単一要素（`<a>`/`<button>`/`<Link>`）を渡す（§5.4-5.6 で担保）。tooltip は CSS 駆動のため runtime error path なし |
| 状態所有 | 増やさない。`useSidebarState` 1 系のみ（I-4）。tooltip 表示は CSS `:hover`/`:focus-within` |

## 5.3 `SidebarTooltip.tsx`（新規・完全シグネチャ + cloneElement ロジック）

```tsx
"use client";

// レーン A — shell 固有の CSS カスタムツールチップ。collapsed の icon-only コントロールを
// 包み、:hover / :focus-within でラベルバブル（role="tooltip"）を表示する。
// collapsed=false ではラップせず children を直返し（AC-A2）。新規 JS state を持たない（I-4）。
import { cloneElement, useId } from "react";
import type { ReactElement } from "react";

export interface SidebarTooltipProps {
  /** ツールチップに表示するラベル（trigger のアクセシブル名と同義）。 */
  readonly label: string;
  /** collapsed=false ならラップせず children を直返し（AC-A2）。 */
  readonly collapsed: boolean;
  /**
   * 単一の trigger 要素（<a> / <Link> / <button> いずれか単体）。
   * aria-describedby を注入するため cloneElement する。既存値があれば連結する。
   */
  readonly children: ReactElement<{ "aria-describedby"?: string }>;
}

export function SidebarTooltip({ label, collapsed, children }: SidebarTooltipProps): ReactElement {
  const tooltipId = useId();

  // collapsed=false: ラベルが既に可視なので tooltip 不要 → children をそのまま返す（DOM 追加なし）。
  if (!collapsed) {
    return children;
  }

  // 既存 aria-describedby を保持しつつ tooltip id を空白連結（name は奪わず description を加算・AC-A6）。
  const existing = children.props["aria-describedby"];
  const describedBy = [existing, tooltipId].filter(Boolean).join(" ");
  const described = cloneElement(children, { "aria-describedby": describedBy });

  return (
    <span data-shell-block="tooltip-wrap" className="ubm-shell-tooltip-wrap">
      {described}
      <span
        role="tooltip"
        id={tooltipId}
        data-shell-block="tooltip"
        className="ubm-shell-tooltip"
      >
        {label}
      </span>
    </span>
  );
}
```

- **collapsed=false パススルー**（AC-A2）: 早期 return で children を素通し。`.ubm-shell-tooltip-wrap` も `[role="tooltip"]` も DOM に出ない。
- **aria-describedby 注入**（AC-A3 / AC-A6）: `[existing, tooltipId].filter(Boolean).join(" ")` で既存 description を先頭保持し tooltip id を追記。trigger の accessible name（sr-only ラベル / aria-label）は **cloneElement で触らない**ため二重読み上げにならない。
- `role="tooltip"` バブルには `aria-hidden` を**付けない**（aria-describedby 参照先のため）。
- `useId()` は React 19 の SSR-safe な一意 id 生成（hydration mismatch なし）。

## 5.4 `SidebarNavItem.tsx`（編集・external/通常 2 分岐を tooltip wrap）

`content` 変数（icon + label span + badge）は**不変**。`item.external` 分岐の `<a>` と通常分岐の `<Link>` を、collapsed 時のみ `SidebarTooltip` で包む。`data-shell-block="nav-item"` はリンク要素に残す（N2 / N6 回帰）。

### Before/After 差分方針

```diff
 "use client";
+import { SidebarTooltip } from "./SidebarTooltip";
 import Link from "next/link";
 ...
   if (item.external) {
+    const externalLink = (
+      <a
+        href={item.href}
+        target="_blank"
+        rel="noopener noreferrer"
+        data-shell-block="nav-item"
+        className={itemClassName}
+      >
+        {content}
+      </a>
+    );
     return (
-      <li>
-        <a href={item.href} target="_blank" rel="noopener noreferrer" data-shell-block="nav-item" className={itemClassName}>
-          {content}
-        </a>
-      </li>
+      <li>
+        <SidebarTooltip label={item.label} collapsed={collapsed}>
+          {externalLink}
+        </SidebarTooltip>
+      </li>
     );
   }
+  const internalLink = (
+    <Link
+      href={item.href}
+      data-shell-block="nav-item"
+      data-active={active ? "true" : "false"}
+      aria-current={active ? "page" : undefined}
+      className={`${itemClassName} border-l-2 border-transparent data-[active=true]:border-[var(--ubm-color-accent)] data-[active=true]:bg-[var(--shell-active-bg)] data-[active=true]:font-semibold data-[active=true]:text-[var(--ubm-color-accent-ink)]`}
+    >
+      {content}
+    </Link>
+  );
   return (
     <li>
-      <Link ...>{content}</Link>
+      <SidebarTooltip label={item.label} collapsed={collapsed}>
+        {internalLink}
+      </SidebarTooltip>
     </li>
   );
```

- `label` は `item.label`（既存 sr-only ラベルと同文言・AC-A6）。
- collapsed=false では `SidebarTooltip` が children を直返しするため、expanded の DOM は現状と完全一致（N4 / 回帰）。
- `<li>` 直下に `.ubm-shell-tooltip-wrap`（collapsed のみ）が入る。リンクの clickable 幅維持のため CSS で `.ubm-shell-tooltip-wrap` を `display: block`（§5.8 / D-3 リスク緩和）にする。

## 5.5 `SidebarShell.tsx`（編集・AdminPublicReturn tooltip + mobile-bar sticky）

### 5.5.1 AdminPublicReturn（レーン A・title 撤去 + tooltip wrap）

```diff
 import { SidebarBrand } from "./SidebarBrand";
+import { SidebarTooltip } from "./SidebarTooltip";
 ...
 function AdminPublicReturn({ collapsed }: { readonly collapsed: boolean }) {
-  return (
-    <Link
-      href="/"
-      data-role="public-return"
-      data-component="admin-sidebar-public-return"
-      aria-label="公開サイトに戻る"
-      title={collapsed ? "公開サイトに戻る" : undefined}
-      className={`flex items-center rounded-sm px-3 py-2 ... ${collapsed ? "justify-center gap-0" : "gap-3"}`}
-    >
-      <span aria-hidden="true" className="...">
-        <ShellIcon id="home" />
-      </span>
-      <span className={collapsed ? "sr-only" : "flex-1"}>公開サイトに戻る</span>
-    </Link>
-  );
+  const link = (
+    <Link
+      href="/"
+      data-role="public-return"
+      data-component="admin-sidebar-public-return"
+      aria-label="公開サイトに戻る"
+      className={`flex items-center rounded-sm px-3 py-2 ... ${collapsed ? "justify-center gap-0" : "gap-3"}`}
+    >
+      <span aria-hidden="true" className="...">
+        <ShellIcon id="home" />
+      </span>
+      <span className={collapsed ? "sr-only" : "flex-1"}>公開サイトに戻る</span>
+    </Link>
+  );
+  return (
+    <SidebarTooltip label="公開サイトに戻る" collapsed={collapsed}>
+      {link}
+    </SidebarTooltip>
+  );
 }
```

- `title` 属性を**削除**（native title は採用しない・D-1。S3 が「title が null になる」を assert）。
- `aria-label="公開サイトに戻る"` は維持（accessible name・AC-A6）。tooltip は description 加算。

### 5.5.2 mobile-bar（レーン C・sticky top-0 z-30 を className 先頭へ）

```diff
           <div
             data-shell="mobile-bar"
-            className="flex items-center gap-2 border-b border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] px-3 py-2 md:hidden"
+            className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] px-3 py-2 md:hidden"
           >
```

- `sticky top-0 z-30` を className **先頭**に追加（S1 / AC-C1 / AC-C2）。
- `md:hidden` は不変（S2 / AC-C3）。背景 `bg-[var(--shell-bar-bg)]` は既存の不透明値で透けない。
- z-index 階層: drawer 40 > mobile-bar 30 > footer 20（Phase 2 §2.3.2）。

> footer 内コントロールの tooltip は desktop `<aside>` 経由の `sidebarFooterContent(collapsed)` で collapsed が真のときに出る。drawer 側は `sidebarFooterContent(false)` で常に expanded のため tooltip 非描画（S3/S5 のスコープを aside に限定する根拠）。

## 5.6 `SidebarUserMenu.tsx`（編集・D-3・summary 内 tooltip バブル直配置）

D-3 により `<summary>` を `SidebarTooltip` で wrap **しない**（`<details>` 直下子は `<summary>` でなければならない制約）。collapsed 時に `<summary>` を relative にして内部へ `<span role="tooltip">` を直接追加し、`<summary>` に `aria-describedby` を付ける（同 CSS class `ubm-shell-tooltip` を流用）。

```diff
-import { useEffect, useRef } from "react";
+import { useEffect, useId, useRef } from "react";
 ...
 export function SidebarUserMenu({ role, user, collapsed }: SidebarUserMenuProps) {
   const detailsRef = useRef<HTMLDetailsElement>(null);
+  const tooltipId = useId();
   ...
   return (
     <details ref={detailsRef} data-shell-block="user-menu" className="group relative border-t ... pt-2">
       <summary
         role="button"
         aria-haspopup="menu"
         aria-label="ユーザーメニュー"
+        aria-describedby={collapsed ? tooltipId : undefined}
-        className={`flex cursor-pointer list-none items-center rounded-sm px-3 py-2 ... ${collapsed ? "justify-center gap-0" : "gap-2"}`}
+        className={`relative flex cursor-pointer list-none items-center rounded-sm px-3 py-2 ... ${collapsed ? "justify-center gap-0" : "gap-2"}`}
       >
         <SidebarUserAvatar initials={user?.initials ?? ""} role={role} size="md" />
         <span className={collapsed ? "sr-only" : "flex min-w-0 flex-col leading-tight"}>
           ...
         </span>
         {isViewer && collapsed ? <span className="sr-only">ログイン</span> : null}
+        {collapsed ? (
+          <span role="tooltip" id={tooltipId} data-shell-block="tooltip" className="ubm-shell-tooltip">
+            ユーザーメニュー
+          </span>
+        ) : null}
       </summary>
       ...
     </details>
   );
 }
```

- `<summary>` に `relative` を追加（tooltip バブルの absolute 基準・既存 details の `relative` は popover 用で別要素）。`:hover`/`:focus-within` トリガは `.ubm-shell-tooltip` 側の親基準だが、summary 直内配置のため summary を `.ubm-shell-tooltip-wrap` 相当の relative コンテキストにする（§5.8 で `summary` に対する hover ルールも追加）。
- `aria-label="ユーザーメニュー"`（name）は維持。tooltip は description（U4 / AC-A6）。
- `<details> > <summary>` 構造不変（U5 / D-3）。tooltip は summary の**内部子**。

> **§5.8 CSS の注意**: user menu の tooltip は `SidebarTooltip` の wrap span 配下ではなく `<summary>` 配下に直置きするため、hover トリガ用の CSS セレクタを `.ubm-shell-tooltip-wrap` だけでなく `summary:hover > .ubm-shell-tooltip` / `summary:focus-within > .ubm-shell-tooltip` にも効かせる（§5.8 で明記）。

## 5.7 `SidebarCollapseToggle.tsx`（編集・collapsed で button wrap）

```diff
 "use client";
+import { SidebarTooltip } from "./SidebarTooltip";
 import { useSidebarShellContext } from "./SidebarShellContext";

 export function SidebarCollapseToggle() {
   const { mode, toggleCollapsed } = useSidebarShellContext();
   const collapsed = mode === "collapsed";
-  return (
-    <button type="button" data-shell-block="collapse-toggle" aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"} ... >
-      <svg ...>...</svg>
-    </button>
-  );
+  const button = (
+    <button
+      type="button"
+      data-shell-block="collapse-toggle"
+      aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
+      aria-expanded={collapsed ? "false" : "true"}
+      onClick={toggleCollapsed}
+      className="hidden items-center justify-center rounded-sm border ... md:inline-flex"
+    >
+      <svg ...>{collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}</svg>
+    </button>
+  );
+  return (
+    <SidebarTooltip label="サイドバーを展開" collapsed={collapsed}>
+      {button}
+    </SidebarTooltip>
+  );
 }
```

- `label="サイドバーを展開"`（collapsed 時の aria-label と同義・C5 / AC-A6）。
- collapsed=false では `SidebarTooltip` が button を直返し（C3 / 回帰）。`onClick`/`aria-label` 等は cloneElement で保持される（C4 / 回帰）。
- button の `hidden md:inline-flex` を保持（md 未満は drawer 表示で toggle 不要）。

## 5.8 `globals.css`（編集・tooltip CSS・shell セクション）

`[data-shell="sidebar"]`（globals.css:1417 付近・`@layer components` 内）と同 layer・同セクションへ追加する。色・影・角丸は全て token 経由（HEX 厳禁・AC-A4）。

```css
  /* === shell collapsed tooltip（レーン A） === */
  .ubm-shell-tooltip-wrap {
    position: relative;
    display: block; /* nav <li> 直下の <a> clickable 幅を維持（D-3 リスク緩和） */
  }

  .ubm-shell-tooltip {
    position: absolute;
    left: calc(100% + var(--ubm-space-2)); /* collapsed sidebar の右側へ吹き出す */
    top: 50%;
    transform: translateY(-50%);
    z-index: 30; /* drawer(40) より下・本文より上（数値・色 token 規約対象外） */
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    padding: var(--ubm-space-1) var(--ubm-space-2);
    border-radius: var(--ubm-radius-sm);
    border: 1px solid var(--ubm-color-border-default);
    background: var(--ubm-color-surface-panel);
    color: var(--ubm-color-text-primary);
    box-shadow: var(--ubm-shadow-md);
    font-size: var(--ubm-text-xs, 12px);
    transition:
      opacity var(--ubm-dur-fast) ease,
      visibility var(--ubm-dur-fast) ease;
  }

  /* wrap 経由（nav item / public-return / collapse toggle） */
  .ubm-shell-tooltip-wrap:hover > .ubm-shell-tooltip,
  .ubm-shell-tooltip-wrap:focus-within > .ubm-shell-tooltip,
  /* user menu は summary 直内配置（D-3） */
  summary:hover > .ubm-shell-tooltip,
  summary:focus-within > .ubm-shell-tooltip {
    opacity: 1;
    visibility: visible;
  }
```

- 全色は `var(--ubm-color-*)`。`z-index` / `opacity` / `transform` / `space` は色でないため `verify-design-tokens` 対象外。
- `display: block` は nav リンク幅維持（D-3 リスク緩和）。`summary` 直内 tooltip 用に `summary:hover/:focus-within > .ubm-shell-tooltip` を併記。
- 配置は既存 shell ルール群（1417 付近）の直後が望ましい（同 selector cluster に co-locate）。

## 5.9 `legacy-public.css`（編集・レーン B・public-footer sticky bottom）

base ブロック `[data-component="public-footer"]`（716 付近）へ sticky / bottom / z-index / background を追加する。mobile block（1197 付近）は `position` を上書きしていないため、base への追加が mobile にも継承される（Phase 2 §2.2.3 確認済）。

```diff
   [data-component="public-footer"] {
     display: flex;
     flex-direction: column;
     gap: 8px;
     padding: 32px 28px;
     margin-top: auto;
+    /* --- レーン B: sticky bottom 固定 --- */
+    position: sticky;
+    bottom: 0;
+    z-index: 20; /* drawer(40)・mobile-bar(30) より下・本文より上 */
+    background: var(--ubm-color-surface-bg); /* 不透明背景でコンテンツが透けない（AC-B2） */
     border-top: 1px solid var(--ubm-color-border-default);
     color: var(--ubm-color-text-secondary);
     font-size: 12px;
   }
```

- `position: sticky; bottom: 0`（D-4・fixed ではない）。containing block は `main` で、コンテンツが viewport より高い間 footer を viewport 下端へ pin（Phase 2 §2.2.2）。
- `background: var(--ubm-color-surface-bg)` で不透明化（AC-B2）。`#xxx` 直書きは禁止（AC-B3・`verify-design-tokens` 対象）。
- mobile block（1197）側の `position` を上書きしないことを実装時に再確認（§5.0.2 と同様の前提）。

## 5.10 実装順序とステップ別検証

1 サイクル / 1 PR だが、内部の実装順は A（tooltip 基盤）→ A（適用）→ C（class）→ B（footer）とする。

| 順 | 作業 | ステップ後検証 |
|----|------|----------------|
| 1 | §5.0.1 / §5.0.2 の gate（token 実在 + overflow）grep | grep 結果が期待どおり |
| 2 | `SidebarTooltip.tsx`（§5.3）+ `globals.css` tooltip CSS（§5.8） | `typecheck` / `SidebarTooltip.spec`（§4.2）GREEN |
| 3 | `SidebarNavItem.tsx`（§5.4）+ `SidebarNavItem.spec` 追記の GREEN 化 | `SidebarNavItem.spec`（N1-N7）GREEN |
| 4 | `SidebarCollapseToggle.tsx`（§5.7）+ `SidebarCollapseToggle.spec` 新規 GREEN 化 | `SidebarCollapseToggle.spec`（C1-C5）GREEN |
| 5 | `SidebarUserMenu.tsx`（§5.6）+ `SidebarUserMenu.spec` 追記 GREEN 化 | `SidebarUserMenu.spec`（U1-U5）GREEN |
| 6 | `SidebarShell.tsx`（§5.5・AdminPublicReturn + mobile-bar）+ `SidebarShell.spec` 追記 GREEN 化 | `SidebarShell.spec`（S1-S5）GREEN |
| 7 | `legacy-public.css`（§5.9・footer sticky） | §4.7 CSS grep が期待文字列 hit |
| 8 | 全体 | `typecheck` / `lint` / shell 全 spec / `verify-design-tokens` / Phase 11 visual |

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run --root=../.. --config=apps/web/vitest.config.ts apps/web/src/components/shell
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
# レーン B 補助 grep（§4.7）
grep -nE "position: sticky|bottom: 0|background: var\(--ubm-color-surface-bg\)" apps/web/src/styles/legacy-public.css
```

## 5.11 DoD（Definition of Done）

- [ ] `SidebarTooltip.tsx` 新規実装（collapsed=false パススルー / collapsed=true で role=tooltip + aria-describedby 連結）。
- [ ] nav item / AdminPublicReturn / collapse toggle が collapsed で `SidebarTooltip` wrap、user menu は summary 内 tooltip 直配置（D-3）。
- [ ] mobile-bar className に `sticky top-0 z-30` 追加・`md:hidden` 維持。
- [ ] `globals.css` に tooltip CSS（token 経由・HEX 0）追加。`legacy-public.css` footer に sticky/bottom/z-index/surface-bg 追加（HEX 0）。
- [ ] AdminPublicReturn の `title` 属性撤去。各 trigger の accessible name（aria-label / sr-only）維持（二重読み上げ回避）。
- [ ] `typecheck` / `lint` green。shell 全 spec（Phase 4 + Phase 6）green。`verify-design-tokens` green。
- [ ] `apps/api` / D1 / Google Form / auth 差分 0（I-1）。`apps/web/src/components/ui/` に新規 primitive 0（I-3・SidebarTooltip は shell 配下）。
- [ ] §4.7 footer CSS grep が期待文字列 hit。Phase 11 で footer/header の sticky を実スクロール / visual で確認。
