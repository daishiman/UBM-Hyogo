---
spec_classification: implementation_spec
state: spec_created
phase: 4
phase_name: テスト計画
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 4: テスト計画

## 4.1 単体 (RTL @ vitest)

Task E が新規所有する spec は **3 file**（Phase 1.2 #3 / #4 / #8）。trap ロジックの branch 網羅は `useFocusTrap.spec.tsx`（単一 source）に集約し、`SidebarDrawer.spec.tsx` は drawer 固有 chrome（dialog 意味論 / backdrop / scroll-lock 属性 / route auto-close）を carve する。`matchMedia` 起点の初期 collapsed 判定は Task A 所有の `useSidebarState.spec.tsx` への追記方針で扱う（4.4 / 4.5 参照）。

| spec path | 対象 | テスト観点 |
|-----------|------|-----------|
| `apps/web/src/lib/a11y/__tests__/useFocusTrap.spec.tsx` | `useFocusTrap.ts` | (1) open で ref 内最初の focusable へ初期 focus (2) Tab で末尾→先頭、Shift+Tab で先頭→末尾ループ (3) Escape で `onClose` (4) focusables 0 件で Tab が preventDefault・例外なし (5) `browserDocument()`=undefined（SSR）相当で no-op (6) close / unmount で previousFocus 復帰・listener 除去 |
| `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx` | `SidebarMobileTrigger.tsx` | (1) click で mock context の `setDrawerOpen(true)` が 1 回呼ばれる (2) button が `md:hidden` class を持つ (3) `aria-label="メニューを開く"` / `aria-haspopup="dialog"` を持つ (4) 自前 state を持たず render 時に `setDrawerOpen` を呼ばない |
| `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | `SidebarDrawer.tsx` | (1) `open=false` で `null`（render 結果が空） (2) `open=true` で `role="dialog" aria-modal="true" aria-label="サイドバーメニュー"` (3) ラッパに `md:hidden` (4) Esc keydown で `onClose`（hook 委譲の結線確認） (5) backdrop click で `onClose`、panel click では `onClose` 非発火 (6) open 後 `document.activeElement` が drawer 内最初の focusable（hook 結線の smoke） (7) open で `document.body[data-shell-drawer-open]="true"`、close / unmount で属性消失 (8) route 変化（`usePathname` mock 切替 + rerender）で drawer 自動 close（unmount） |

> trap の全 branch（Tab 両境界 / SSR no-op / focusables 0 件 / previousFocus）は `useFocusTrap.spec` が網羅する。`SidebarDrawer.spec` は trap を再検証せず「hook が結線されている」smoke（初期 focus が当たる・Esc で onClose）に留め、テストの重複も避ける（I-E6 の精神をテスト層にも適用）。

### 4.1.1 Drawer.tsx 内部 refactor の回帰

`Drawer.tsx` を `useFocusTrap` 経由へ内部 refactor するため、既存 `apps/web/src/components/ui/__tests__/primitives.component.spec.tsx` の Drawer ケースが**無改修で green** であることを Phase 9 で回帰確認する（公開 API・DOM 出力不変の担保）。

> RTL の render 環境は既存 `apps/web` の vitest jsdom config を踏襲する（`apps/web/vitest.config.ts`）。
> `usePathname` は `vi.mock("next/navigation", ...)`、`useSidebarShellContext` は `vi.mock("../SidebarShellContext", ...)` で差し替える。

## 4.2 構造 grep gate (任意)

本 task では新規 grep gate を増やさない。

- AC-E1 の class 文字列（`hidden md:flex` / `md:hidden`）は `SidebarShell.spec` / `SidebarMobileTrigger.spec` / `SidebarDrawer.spec` の DOM assertion で carve する。
- HEX 0 件 / palette class 0 件は既存 `verify-design-tokens` CI gate（task-18, P50-5）へ委譲する。Phase 9 で grep を 1 回手動確認する。

## 4.3 visual (Task F 委譲)

Playwright visual baseline / smoke（375 / 768 / 1280px の 3 viewport 自動化）は Task F の担当（Phase 1.5 スコープ外）。
本 task は Phase 11 で reference screenshot（mobile drawer open / md collapsed / lg expanded）を配置し、手動確認まで行う。

## 4.4 AC → spec マッピング

| AC | 検証 spec | ケース概要 |
|----|-----------|-----------|
| AC-E1 | `SidebarShell.spec`（Task A 所有・4.5 参照）+ `SidebarMobileTrigger.spec` | `<aside>` の `hidden md:flex` / trigger の `md:hidden` |
| AC-E2 | `SidebarMobileTrigger.spec` | click → `setDrawerOpen(true)` 1 回 |
| AC-E3 | `SidebarDrawer.spec` | `getByRole("dialog")` + `aria-modal="true"` |
| AC-E4 | `SidebarDrawer.spec` | Esc keydown / backdrop click → `onClose` |
| AC-E5 | `SidebarDrawer.spec` | `document.body` の `data-shell-drawer-open` 付与/除去 |
| AC-E6 | `SidebarDrawer.spec` | open 後 `activeElement`=最初の focusable + Tab ループ |
| AC-E7 | `SidebarDrawer.spec`（+ 必要なら `useSidebarState.spec`） | pathname 変化で drawer close |
| AC-E8 | `SidebarDrawer.spec` | drawer 内リンク click → pathname 変化 mock → drawer unmount |
| AC-E9 | `useSidebarState.spec`（Task A 所有・追記） | `matchMedia('(min-width:1024px)')` false→`collapsed` / true→`expanded` / localStorage 既存値優先 |
| AC-E10 | `useSidebarState.spec`（Task A 所有・追記） | SSR 経路（`window` 不在）で `matchMedia` 未呼出、初期 expanded fallback |
| AC-E11 | `SidebarDrawer.spec`（+ `SidebarShell.spec`） | drawer ラッパに `md:hidden`、`open=false` で unmount |

## 4.5 既存 spec への追記方針（Task A 所有領域）

`SidebarShell.spec.tsx` / `useSidebarState.spec.tsx` は Task A が所有する。Task E は以下の方針で扱う:

- **AC-E9 / AC-E10（初期 collapsed / matchMedia 1 回）**: hook の内部挙動であり、新規 2 spec の DOM 観測だけでは branch を網羅できないため、`useSidebarState.spec.tsx` に `matchMedia` mock ケースを **追記** する（Phase 6.4 で骨子を提示）。Task A の既存ケースは破壊しない（追記のみ）。
- **AC-E1（`<aside>` の `hidden md:flex`）/ AC-E11（drawer ラッパ unmount 設計）**: `SidebarShell` の render 結果に対する class assertion であり、`SidebarShell.spec.tsx` に **追記** する。Task A が当該 spec を未作成の場合は、Task E が `SidebarShell.spec.tsx` を新規作成して AC-E1 / AC-E11 ケースのみを置く（Phase 5 着手時に存在確認、P50-2 gate）。
- いずれの追記も Task A の既存テストと同一 describe ファイルへの append とし、既存 it ブロックを変更しない。
