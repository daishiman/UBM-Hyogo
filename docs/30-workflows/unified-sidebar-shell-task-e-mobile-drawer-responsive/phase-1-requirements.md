---
spec_classification: implementation_spec
state: spec_created
phase: 1
phase_name: 要件定義
created_at: 2026-05-29
task_type: implementation
visual_category: VISUAL
implementation_mode: new
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
source_task: docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-E-mobile-drawer-responsive.md
---

# Phase 1: 要件定義

[実装区分: 実装仕様書] — 親 task ファイルが冒頭で `[実装区分: 実装仕様書]` を明示。新規 Client component 2 件・既存 hook / shell の編集・focus trap / scroll lock / route 連動 close を伴うため、ドキュメントのみでは目的（「`< md` で drawer 表示」「タブレットで初期 collapsed」）を達成できない（CONST_004）。

## 1.1 ゴール

`SidebarShell` のレスポンシブ挙動を 3 段で確立する:

1. **`< 768px`（sm）**: sidebar `<aside>` を hidden 化し、左上 56px ストリップの hamburger trigger（`SidebarMobileTrigger`）から overlay drawer（`SidebarDrawer`）として nav 全体を表示する。
2. **`768〜1023px`（md）**: sidebar は表示するが**初期 collapsed**。drawer は unmount。hamburger は hidden。
3. **`>= 1024px`（lg）**: sidebar は表示し**初期 expanded**（localStorage `ubm:shell:collapsed` 優先）。drawer は unmount。hamburger は hidden。

breakpoint の表示切替は CSS（Tailwind `md:`）を正本とし、JS の `matchMedia` 依存は「初回マウント時の初期 collapsed 判定」の 1 回だけに閉じる（SSR では参照しない）。

## 1.2 スコープ（Task E core 6 + 共有 a11y 基盤 3）

| # | path | 種別 | 修正内容 |
|---|------|------|---------|
| 1 | `apps/web/src/components/shell/SidebarMobileTrigger.tsx` | 新規 (Client) | hamburger button。`md+` で `hidden`。`SidebarShellContext` 経由で `setDrawerOpen(true)` |
| 2 | `apps/web/src/components/shell/SidebarDrawer.tsx` | 新規 (Client) | `role="dialog" aria-modal="true"` overlay。focus trap は `useFocusTrap` 委譲。backdrop click / scroll lock / md:hidden / token 幅は本 component 固有 chrome |
| 3 | `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx` | 新規 | trigger の context 連動・`md+ hidden` class |
| 4 | `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | 新規 | open/close・Esc・backdrop・focus・scroll lock・route auto-close |
| 5 | `apps/web/src/components/shell/SidebarShell.tsx` | 編集 | drawer を mount、`< md` で `<aside>` を `hidden md:flex` 化、`mobileTriggerSlot` 配置 |
| 6 | `apps/web/src/components/shell/useSidebarState.ts` | 編集 | `usePathname()` watch で route 変化時 `setDrawerOpen(false)`、初回マウント時 `md~lg` のみ初期 collapsed 判定 |
| 7 | `apps/web/src/lib/a11y/useFocusTrap.ts` | 新規 | dialog focus trap の単一 source。`Drawer.tsx` の trap ロジック（初期 focus / Tab ループ / Esc / previousFocus 復帰・`browserDocument()` SSR 安全）を hook 抽出。`useFocusTrap(open, onClose, ref)` |
| 8 | `apps/web/src/lib/a11y/__tests__/useFocusTrap.spec.tsx` | 新規 | trap の branch（open/close・Tab/Shift+Tab 境界ループ・Esc→onClose・focusables 0 件・SSR no-op・previousFocus 復帰）を網羅 |
| 9 | `apps/web/src/components/ui/Drawer.tsx` | 編集（**内部 refactor のみ**） | inline focus trap を `useFocusTrap(open, onClose, dialogRef)` 呼び出しへ置換。公開 props `{ open, onClose, title, children }` と DOM 出力は不変。既存 consumer（`MemberDrawer` / `BulkRepublishDrawer` / `primitives.component.spec`）は無改修で green を維持 |

## 1.3 受け入れ条件（AC）

| ID | 内容 | 検証方法 |
|----|------|---------|
| AC-E1 | `< md` で `<aside>` が DOM 上 hidden（`hidden md:flex`）、hamburger が visible（`md:hidden`） | `SidebarShell.spec` で `<aside>` の class に `hidden` / `md:flex`、trigger に `md:hidden` を assert |
| AC-E2 | hamburger クリックで context の `setDrawerOpen(true)` が呼ばれる | `SidebarMobileTrigger.spec`：mock context の `setDrawerOpen` が `true` で 1 回呼ばれる |
| AC-E3 | `open=true` で drawer が `role="dialog" aria-modal="true"` として表示される | `SidebarDrawer.spec`：`getByRole("dialog")` が存在、`aria-modal="true"` |
| AC-E4 | Esc キー / backdrop クリックで `onClose` が発火 | `SidebarDrawer.spec`：Esc keydown / backdrop click で `onClose` mock が呼ばれる |
| AC-E5 | drawer open 時に `<body>` へ `data-shell-drawer-open="true"` を付与、close / unmount で除去 | `SidebarDrawer.spec`：open で `document.body` 属性 = `"true"`、close で属性消失 |
| AC-E6 | 初期 focus が drawer 内最初の focusable（リンク）へ移動、focus trap が機能 | `SidebarDrawer.spec`：open 後に最初のリンクが `document.activeElement` |
| AC-E7 | route 変化（`usePathname` 変化）で drawer が自動 close される | `SidebarDrawer.spec` or `useSidebarState.spec`：pathname 変更で `drawerOpen=false` |
| AC-E8 | drawer 内リンククリックで auto-close + 遷移（route 変化に伴う close と整合） | `SidebarDrawer.spec`：リンク click → pathname 変化 mock → drawer unmount |
| AC-E9 | `md~lg`（`< 1024px`）初回マウントで初期 collapsed、`>= 1024px` は expanded（localStorage 優先） | `useSidebarState.spec`：`matchMedia('(min-width:1024px)')` mock=false → `mode='collapsed'`、true → `'expanded'` |
| AC-E10 | breakpoint 切替は CSS のみ。`matchMedia` 参照は初期 collapsed 判定の 1 回限り（SSR 未参照） | `useSidebarState.spec`：SSR 経路（window 不在 mock）で matchMedia 未呼出、初期値は expanded fallback |
| AC-E11 | drawer は `md:hidden` を持ち md+ では非表示 / unmount される | `SidebarDrawer.spec` or `SidebarShell.spec`：drawer ラッパに `md:hidden` class、md 以上は render されない設計を assert |

## 1.4 不変条件

- **I-E1**: Task A の `useSidebarState` / `SidebarShellContext` / `SidebarShell` の公開シグネチャを破壊しない。`drawerOpen` / `setDrawerOpen` は Task A で既に定義済の戻り値。Task E は「route 連動 close」「初期 collapsed 判定」の挙動を hook 内へ追加するのみ（後方互換）。
- **I-E2**: drawer / collapse の state owner は `useSidebarState` 1 系のみ。`SidebarMobileTrigger` / `SidebarDrawer` は自前 state を持たず、context（`SidebarShellContext`）経由で読む。
- **I-E3**: API endpoint / D1 / Google Form schema / auth middleware には触らない（親不変条件 #5、本 task 親不変条件 #1 既存 API のみ接続）。
- **I-E4**: 色・寸法は tokens 経由（Task A 追加の `--shell-bar-w` 等）。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` gate 対象）。
- **I-E5**: breakpoint の表示切替は CSS（Tailwind `md:`）を正本とする。JS `matchMedia` 依存は初期 collapsed 判定の 1 回のみ。resize に追従する matchMedia listener は設けない（DoD 4 の挙動は CSS で実現）。
- **I-E6**: focus trap（初期 focus / Tab ループ / Esc / `previousFocus` 復帰・`browserDocument()` SSR 安全）は `apps/web/src/lib/a11y/useFocusTrap.ts` を**単一 source** とする。これは既存 `Drawer.tsx` の確立済 trap ロジックを hook 抽出したもので、`Drawer.tsx`（内部 refactor のみ・公開 API 不変）と `SidebarDrawer.tsx` の双方が同一 hook を呼ぶ。SidebarDrawer に trap を再実装しない（複製ゼロ）。backdrop click / scroll lock（body 属性）/ md:hidden / token 幅は SidebarDrawer 固有の chrome として hook の外側で実装する。

## 1.5 スコープ外

- `SidebarShell` の core / nav / collapse toggle 本体 → Task A
- UserMenu（drawer 内に差し込む user chip / sign out） → Task B（drawer の `children` として受け取るのみ）
- public / member layout への mount → Task C
- admin layout 移行・旧 `AdminSidebar` 削除 → Task D
- Playwright visual baseline / smoke（375 / 768 / 1280px の自動化） → Task F（本 task は Phase 11 で reference screenshot 配置 + 手動確認まで）

## 1.6 P50 チェック

| # | 項目 | 結果 |
|---|------|------|
| P50-1 | 親 task ファイル `task-E-mobile-drawer-responsive.md` が存在し `[実装区分: 実装仕様書]` 明示 | YES |
| P50-2 | 前提となる Task A 成果物（`apps/web/src/components/shell/` の `useSidebarState` / `SidebarShellContext` / `SidebarShell`）が同一サイクル内で先行実装される | 前提（実装プロンプト着手時に存在確認。現 dev には未実装のため P50-2 を Phase 5 着手の gate とする） |
| P50-3 | 既存 focus-trap primitive `apps/web/src/components/ui/Drawer.tsx`（`useFocusTrap` 抽出元）+ `browserDocument()` (`apps/web/src/lib/is-browser.ts`) + a11y hook 配置先 `apps/web/src/lib/a11y/`（`useAutoFocusOnMount.ts` 先例）が存在 | YES（確認済。`Drawer.tsx` の trap ロジックを `useFocusTrap` へ逐語抽出する元として利用） |
| P50-4 | `usePathname`（`next/navigation`）が既存コードで利用実績あり | YES（`AdminSidebarNavItem.tsx` 等で使用） |
| P50-5 | `verify-design-tokens` CI gate 稼働中 | YES（task-18 で導入済） |
| P50-6 | apps/web の vitest filter 名 = `@ubm-hyogo/web` | YES（`apps/web/package.json` 確認済。親 task の `@ubm/web` 表記は別名であり、本 spec は `@ubm-hyogo/web` を正とする） |

→ P50-1 / 3 / 4 / 5 / 6 PASS。P50-2 は Task A 先行実装を Phase 5 着手 gate とする。Phase 2 着手可能。
