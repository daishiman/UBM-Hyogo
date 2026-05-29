---
phase: 12
phase_name: ドキュメント同期 / implementation-guide
task: unified-sidebar-shell-task-e-mobile-drawer-responsive
created_at: 2026-05-29
---

# unified-sidebar-shell Task A + Task E 実装ガイド

## 概要

本サイクルでは **Task E（mobile / tablet drawer + responsive 挙動）** を完了させるため、
その前提である **Task A（SidebarShell primitive）を先行フル実装**した（ユーザー判断: 「Task A をフル実装してから Task E」）。

現ブランチには Task A 成果物（`apps/web/src/components/shell/`）が一切存在せず、Task E は Task A の
`useSidebarState` / `SidebarShellContext` / `SidebarShell` / shell トークン契約に依存するため、
Task A → Task E の順で同一サイクル内に実装した（CONST_009 準拠・先送りなし）。

## Task A — SidebarShell primitive（新規 14 + tokens 編集 1）

| ファイル | 役割 |
|---------|------|
| `apps/web/src/components/shell/shell-config.ts` | `ShellRole` / `ShellNavItem` 型 + `buildNavForRole`（viewer 3 / member 4 / admin 13）+ `isNavItemActive` |
| `apps/web/src/components/shell/icons.tsx` | 純 SVG line-icon（nav + `MenuIcon` + collapse chevron）。色は `currentColor` のみ |
| `apps/web/src/components/shell/useSidebarState.ts` | state owner 1 系（`mode` / `drawerOpen` / `toggleCollapsed` / `setDrawerOpen`）。localStorage `ubm:shell:collapsed` 永続 |
| `apps/web/src/components/shell/SidebarShellContext.tsx` | drawer/collapse を子孫へ配る Client context + provider |
| `apps/web/src/components/shell/SidebarBrand.tsx` | brand block（collapsed で label を `sr-only`） |
| `apps/web/src/components/shell/SidebarNav.tsx` / `SidebarNavGroup.tsx` / `SidebarNavItem.tsx` | nav rendering + active 判定 + badge |
| `apps/web/src/components/shell/SidebarCollapseToggle.tsx` | expand/collapse トグル（`aria-expanded`） |
| `apps/web/src/components/shell/SidebarShell.tsx` | Client shell（provider + aside + main + drawer mount） |
| `apps/web/src/components/shell/SidebarShell.server.tsx` | server boundary（session→role→nav 解決、getSession 失敗で viewer fallback） |
| `apps/web/src/styles/tokens.css` | shell トークン追加（`--shell-bar-w` / `-collapsed` / `-bg` / `-border` / `-fg` / `-active-bg` / `-active-fg` / `-overlay`） |

> **Task B との接続点**: Task A spec は `SidebarShellServer` 内で `<SidebarUserMenu />`（Task B）を注入する設計だが、Task B は別 sibling task で未実装のため、本実装では SidebarShell 内に自己完結の user footer（Avatar + name/email + 既存 `SignOutButton`）を置いた。Task B 着地時にこの footer を `UserMenu` へ差し替える seam とする（公開 props 不変）。

## Task E — mobile drawer + responsive（新規 5 + 編集 3）

| ファイル | 役割 |
|---------|------|
| `apps/web/src/lib/a11y/useFocusTrap.ts` | **focus trap の単一 source**。`Drawer.tsx` の inline trap を逐語抽出（初期 focus / Tab 境界ループ / Esc→onClose / previousFocus 復帰 / SSR no-op） |
| `apps/web/src/components/shell/SidebarMobileTrigger.tsx` | hamburger（`md:hidden` / `aria-haspopup="dialog"` / context の `setDrawerOpen(true)`） |
| `apps/web/src/components/shell/SidebarDrawer.tsx` | overlay drawer（`role="dialog" aria-modal`）。trap は hook 委譲、scroll lock 属性 / backdrop / `md:hidden` / token 幅は固有 chrome |
| `apps/web/src/components/shell/useSidebarState.ts`（編集） | route 変化で drawer 自動 close + 初回 `matchMedia` で初期 collapsed 判定（1 回限り） |
| `apps/web/src/components/shell/SidebarShell.tsx`（編集） | `<aside>` を `hidden md:flex` 化 + sm 専用 56px ストリップ + drawer mount |
| `apps/web/src/components/ui/Drawer.tsx`（編集） | inline trap を `useFocusTrap` 呼び出しへ置換（**公開 API・DOM 不変**） |
| `apps/web/src/styles/globals.css`（編集） | `body[data-shell-drawer-open="true"] { overflow: hidden }` scroll lock |

## responsive マトリクス（正本）

| viewport | `<aside>` | drawer | hamburger | 実現手段 |
|---------|-----------|--------|-----------|---------|
| `< 768px` | hidden | overlay 可 | visible | `hidden md:flex` + drawer/trigger `md:hidden` |
| `768〜1023px` | visible（初期 collapsed） | unmount | hidden | CSS `md:flex` + 初期 collapsed 判定 |
| `>= 1024px` | visible（初期 expanded / localStorage 優先） | unmount | hidden | CSS + 初期 expanded |

## 不変条件の遵守

- I-E1: `useSidebarState` 戻り値 shape 不変（挙動追加のみ）
- I-E2: state owner は `useSidebarState` 1 系。trigger/drawer は context 経由（自前 state なし）
- I-E3: API / D1 / Google Form / auth middleware 不変（一切触れていない）
- I-E4: 色・寸法は token 経由。HEX / `bg-[#xxx]` ゼロ（`verify:tokens` 91 tracked / 0 drift）
- I-E5: breakpoint は CSS `md:` 正本。`matchMedia` 参照は初期判定 1 回のみ（resize listener なし）
- I-E6: focus trap は `useFocusTrap` 単一 source。`Drawer` / `SidebarDrawer` が共有（複製ゼロ）

## 検証結果（ローカル）

| gate | コマンド | 結果 |
|------|---------|------|
| focused vitest | `vitest run apps/web/src/components/shell apps/web/src/lib/a11y` | **44 PASS / 7 files**（新規 Task A+E spec 41 + 既存 `useAutoFocusOnMount` 3）。primitives 回帰込みの focused run は 67 PASS / 7 files = `../phase-6/focused-vitest.log` |
| Drawer 回帰 | `primitives.component.spec` + `MemberDrawer` + `BulkRepublishDrawer` | **33 PASS**（無改修） |
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | **green** |
| lint | `eslint src/components/shell src/lib/a11y src/components/ui/Drawer.tsx` | **green** |
| design tokens | `pnpm run verify:tokens` | **✓ 91 tracked / 0 drift** |

## スクリーンショット

ライブ route screenshot は **pending**。SidebarShell の route mount は Task C/D の責務（本タスク範囲外）であり、
現時点でコンポーネントが production route に未配線のため実画面が出ない。responsive 契約は component-level RTL（AC-E1〜E11 全 green）で carve 済み。visual baseline は Task F（Playwright）委譲。
詳細: [`../phase-11/manual-test-result.md`](../phase-11/manual-test-result.md) §3。

## 後続タスク（先送りではなく責務境界）

- Task B: `SidebarUserMenu` 実装後、SidebarShell footer を差し替え
- Task C/D: SidebarShell を public/member/admin layout へ mount
- Task F: 375/768/1280px の Playwright visual baseline + smoke
