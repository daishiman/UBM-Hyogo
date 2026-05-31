---
phase: 11
phase_name: 手動テスト / Evidence
task: unified-sidebar-shell-task-e-mobile-drawer-responsive
captured_at: 2026-05-29
evidence_status: present
screenshot_status: pending
---

# Phase 11: 手動テスト / Evidence 結果

## 実施サマリ

| 項目 | 結果 |
|------|------|
| 実施日 | 2026-05-29 |
| 実施者 | Claude Code（自動実装サイクル） |
| focused vitest（新規 spec 群） | **PASS**（67 tests / 7 files green） |
| ライブ route screenshot（375/768/1280px） | **pending**（理由は §3） |
| visual baseline（Playwright） | Task F 委譲（本タスク範囲外） |

## 1. responsive contract の検証状況（component-level RTL）

本タスクの全受け入れ条件（AC-E1〜AC-E11）は RTL の DOM assertion で検証済み。すべて green。

| AC | 検証 spec | ケース | 結果 |
|----|-----------|--------|------|
| AC-E1 | `SidebarShell.spec` / `SidebarMobileTrigger.spec` | `<aside>` の `hidden md:flex` / trigger の `md:hidden` | PASS |
| AC-E2 | `SidebarMobileTrigger.spec` | click → `setDrawerOpen(true)` 1 回 | PASS |
| AC-E3 | `SidebarDrawer.spec` | `role="dialog"` + `aria-modal="true"` | PASS |
| AC-E4 | `SidebarDrawer.spec` / `useFocusTrap.spec` | Esc / backdrop click → `onClose`（panel click 非発火） | PASS |
| AC-E5 | `SidebarDrawer.spec` | `body[data-shell-drawer-open]` 付与/除去 | PASS |
| AC-E6 | `SidebarDrawer.spec`（結線 smoke）/ `useFocusTrap.spec`（全 branch） | 初期 focus + Tab 両境界ループ | PASS |
| AC-E7 | `SidebarShell.spec` | pathname 変化 → drawer 自動 close（unmount） | PASS |
| AC-E8 | `SidebarShell.spec` | trigger open → route 変化 → drawer 消失 | PASS |
| AC-E9 | `useSidebarState.spec` | `matchMedia(min-width:1024px)` false→collapsed / true→expanded / localStorage 優先 | PASS |
| AC-E10 | `useSidebarState.spec` | matchMedia 1 回限り（resize listener 不在）/ SSR no-op expanded fallback | PASS |
| AC-E11 | `SidebarDrawer.spec` | wrapper `md:hidden` / `open=false` で unmount | PASS |

focused vitest ログ: [`../phase-6/focused-vitest.log`](../phase-6/focused-vitest.log)

## 2. Drawer.tsx 内部 refactor の回帰

`apps/web/src/components/ui/__tests__/primitives.component.spec.tsx` の Drawer 3 ケース（role=dialog / Esc→onClose / Tab trap）は無改修で green（26 tests PASS）。
consumer（`MemberDrawer` / `BulkRepublishDrawer`）spec も無改修で green（7 tests PASS）。公開 API・DOM 出力不変を担保（R-E7 / I-E6）。

## 3. ライブ route screenshot が pending の理由（構造的依存）

Phase 11.1 が指定する screenshot 取得 route（`/profile` member layout / `/admin` admin layout）への **SidebarShell mount は Task C（public/member layout 統合）・Task D（admin layout 移行）の責務であり、本タスク（Task E）のスコープ外**（Phase 1.5 スコープ外節）。

本タスクが新設・編集したコンポーネント（`SidebarShell` / `SidebarDrawer` / `SidebarMobileTrigger` 等）は、まだいずれの production route にも配線されていない。そのため `pnpm dev` で 375/768/1280px の実画面を開いて撮影することは構造的に不可能（撮影対象が画面に出ない）。

- これは「先送り（疲労・スコープ縮小）」ではなく、**sibling task の責務境界による構造的依存**。
- responsive 表示契約（AC-E1〜E11）は §1 の component-level RTL で完全に carve 済み。
- ライブ画面の visual baseline は **Task F（visual baseline smoke / 375・768・1280px Playwright 自動化）** が正式な責務（Phase 11.4 / 4.3）。
- スクリーンショットの捏造は行わない。Task C/D による mount 後、または Task F の Playwright baseline で実画面 evidence を取得する。

> 結論: `screenshot_status: pending`。Gate-B の「screenshot 4 枚 present」は Task C/D mount または Task F に依存するため、本タスク単独では `present` にできない。本タスクの DoD（新規 spec green / typecheck / lint / token gate）は §1・§2・Phase 9 で達成済み。
