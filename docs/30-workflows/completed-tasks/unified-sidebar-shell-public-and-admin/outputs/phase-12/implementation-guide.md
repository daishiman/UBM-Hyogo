---
実装区分: 実装仕様書
状態: spec_created
Phase: 12
作成日: 2026-05-28
task_id: unified-sidebar-shell-public-and-admin
---

# Implementation Guide

## Part 1: 中学生レベルの説明

今は公開ページ、マイページ、管理ページで画面の枠が別々に作られている。これを同じサイドバー部品にまとめる。ログインしていない人には公開メニューだけ、会員にはマイページも、管理者には管理メニューも出す。スマホでは横に出しっぱなしにせず、ボタンで開く引き出しにする。

## Part 2: 技術者向け

`SidebarShellServer` が `getSession()` を呼び、`viewer` / `member` / `admin` の role と nav groups を構築して `SidebarShell` に渡す。client 側は collapsed / drawer state、active item、UserMenu popover のみを持つ。

### 実装順

1. Task A: shell primitive / nav config / tokens
2. Task B: UserMenu / Avatar / action config
3. Task E: mobile trigger / drawer
4. Task C: public/member layout integration and legacy header deletion
5. Task D: admin layout migration and legacy AdminSidebar deletion
6. Task F: Playwright smoke / visual baseline

### Task B sub-workflow

Task B is additionally formalized at `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/`.
Its strict 7 content writes through to this parent root; the sub-workflow owns only
`outputs/phase-12/phase12-task-spec-compliance-check.md` to avoid duplicate Phase 12 SSOT.

Task B local implementation evidence is present:

- Focused Vitest: `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/user-menu-config.spec.log`
- Focused Vitest: `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/sidebar-user-menu.spec.log`
- Visual screenshots:
  - `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/screenshots/user-menu-viewer.png`
  - `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/screenshots/user-menu-member.png`
  - `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/screenshots/user-menu-admin.png`
  - `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/screenshots/user-menu-collapsed.png`

### 不変条件

- role 判定は `SessionUser.isAdmin` のみ
- API / D1 / Google Form schema / Auth.js middleware は変更しない
- admin nav は現行 `AdminSidebar.tsx` の 9 admin item を維持
- visual baseline は Linux runner を正とし、macOS local PNG は commit しない

## Task E — mobile drawer + responsive（集約: 詳細は `../../unified-sidebar-shell-task-e-mobile-drawer-responsive/outputs/phase-12/implementation-guide.md`）

本サイクルで Task A（前提 primitive）をフル実装した上で Task E を実装完了した。

### responsive マトリクス（正本）

| viewport | `<aside>` | drawer | hamburger | 実現手段 |
|---------|-----------|--------|-----------|---------|
| `< 768px`（sm） | hidden | overlay 可 | visible | `hidden md:flex` + drawer/trigger `md:hidden` |
| `768〜1023px`（md） | visible（初期 collapsed） | unmount | hidden | CSS `md:flex` + `useSidebarState` 初期 collapsed 判定 |
| `>= 1024px`（lg） | visible（初期 expanded / localStorage 優先） | unmount | hidden | CSS + 初期 expanded |

### 主要実装

- `apps/web/src/lib/a11y/useFocusTrap.ts`: focus trap の**単一 source**（初期 focus / Tab 境界ループ / Esc→onClose / previousFocus 復帰 / SSR no-op）。`Drawer.tsx` の inline trap を抽出し、`Drawer.tsx`（内部 refactor・公開 API 不変）と `SidebarDrawer.tsx` が共有（複製ゼロ・I-E6）。
- `apps/web/src/components/shell/SidebarDrawer.tsx`: `role="dialog" aria-modal` overlay。trap は hook 委譲、scroll lock 属性 / backdrop click / `md:hidden` / token 幅は固有 chrome。
- `apps/web/src/components/shell/SidebarMobileTrigger.tsx`: hamburger（`md:hidden` / `aria-haspopup="dialog"` / context の `setDrawerOpen(true)`）。
- `apps/web/src/components/shell/useSidebarState.ts`（編集）: `usePathname()` 変化で drawer 自動 close + 初回 `matchMedia('(min-width:1024px)')` で初期 collapsed 判定（1 回限り・resize 非追従）。
- `apps/web/src/styles/globals.css`（編集）: `body[data-shell-drawer-open="true"] { overflow: hidden }`（属性 + CSS の scroll lock。`body.style` 直書きを避け hydration mismatch を回避）。

### ローカル検証

focused vitest **新規 41 PASS / 6 files**（primitives 回帰 26 込みの focused run = 67 PASS / 7 files）、Drawer 回帰 33 PASS（無改修）、typecheck green、lint green、`verify:tokens` 91 tracked / 0 drift。ライブ route screenshot は Task C/D の layout mount 依存、visual baseline は Task F 委譲、PR は user-gated。
