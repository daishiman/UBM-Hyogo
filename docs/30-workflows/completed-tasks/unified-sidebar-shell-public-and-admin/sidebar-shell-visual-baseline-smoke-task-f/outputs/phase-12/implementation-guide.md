---
実装区分: 実装（実行済み）
状態: implemented_local_evidence_captured
Phase: 12
作成日: 2026-05-29
備考: 仕様時点の implementation-guide は implementation-guide.spec-original.md に保存
---

# Implementation Guide — unified Sidebar Shell（Task A〜E）+ visual baseline / smoke（Task F）

## 概要

公開（viewer）／会員（member）／管理（admin）の 3 層を **共通の collapsible Sidebar Shell** へ統合し、
その regression を Playwright（3 role × 3 viewport の visual baseline + 6 smoke）と CI で守る。

Task F は親 `unified-sidebar-shell-public-and-admin` の Task A〜E 完了が前提のため、本サイクルで
A〜E を先行実装してから Task F を実装した（ユーザー指示「親 A-E から全実装」）。

## 中学生にもわかる説明

これまではページごとに「上の帯メニュー（公開・会員）」と「左の縦メニュー（管理）」がバラバラで、
ログインして画面を移動するとメニューの形が変わっていた。今回、全部を**左の縦メニュー（サイドバー）**に
統一した。サイドバーは折りたためて、スマホでは「三本線ボタン」を押すと横から滑り出す引き出し（drawer）になる。
誰が見ているか（未ログイン／会員／管理者）で、表示するメニュー項目と左下のユーザーメニューが自動で変わる。
そして「見た目が壊れていないか」を写真で記録して自動チェックする仕組み（visual baseline）と、
「クリックしたら正しく動くか」の自動テスト（smoke）を CI に組み込んだ。

## 実装ファイル

### 新規（`apps/web/src/components/shell/`）— Task A/B/E

`shell-config.ts`・`icons.tsx`・`useSidebarState.ts`・`SidebarShellContext.tsx`・
`SidebarBrand/Nav/NavGroup/NavItem/CollapseToggle.tsx`・`SidebarShell.tsx`・`SidebarShell.server.tsx`・
`SidebarUserMenu.tsx`・`SidebarUserAvatar.tsx`・`user-menu-config.ts`・`SidebarMobileTrigger.tsx`・
`SidebarDrawer.tsx` + `__tests__/`（8 spec）

### 編集 — Task C/D

- `app/(public)/layout.tsx`・`app/(member)/layout.tsx`・`app/(admin)/layout.tsx`: async server 化 + `SidebarShellServer` 委譲
- `app/(public)/page.tsx`（旧 `app/page.tsx`）・`app/(member)/profile/page.tsx`: 旧 header/footer 直描画を撤去
- ルート再配置: `/`・`/privacy`・`/terms` を `(public)` グループへ移動（シェル layout 配下へ）
- `src/styles/tokens.css`: shell トークン 5 件追加

### 削除

`PublicHeader.tsx`・`MemberHeader.tsx`・`AdminSidebar.tsx`（+ 各 spec 計 4）

### Task F

- `apps/web/playwright/tests/sidebar-shell/_helpers.ts`・`sidebar-shell-smoke.spec.ts`・`sidebar-shell-visual.spec.ts`
- `apps/web/playwright.config.ts`: project 4 件追加 + 既存 default project の testIgnore に `sidebar-shell/`
- `.github/workflows/playwright-smoke.yml`: smoke step + `sidebar-shell-visual` matrix（3 viewport）

## DOM 契約（selector）

| testid | 要素 |
| --- | --- |
| `app-shell` | shell root |
| `shell-sidebar` | persistent サイドバー（md+ 表示、`data-collapsed` 属性） |
| `shell-nav` | nav 本体（role 別件数: viewer 3 / member 4 / admin 13） |
| `shell-user-menu` | 左下ユーザーメニュー（viewer=直リンク / member・admin=`<details>` popover） |
| `shell-drawer-toggle` | hamburger（< md） |
| `shell-drawer` | mobile overlay drawer（`role="dialog"`） |
| `shell-collapse-toggle` | collapse/expand トグル |

collapse 永続化キー: `ubm:shell:collapsed`（localStorage, JSON boolean）

## 検証結果

| 検証 | 結果 |
| --- | --- |
| `typecheck` / `lint` | ✅ green |
| `verify-design-tokens` | ✅ `91 tracked` in sync |
| unit（shell + layout, vitest） | ✅ 45 passed |
| smoke e2e（S1〜S6） | ✅ 6/6 passed（warm dev server） |
| visual baseline 機構（V1〜V3 desktop） | ✅ 撮影成功（macOS baseline は非 commit / CI Linux 正本） |

## スクリーンショット

`outputs/phase-11/screenshots/`（viewer home / member profile / admin dashboard、いずれも 1280 desktop, macOS local evidence）。

## user-gated（本サイクル外 / 明示承認後）

- baseline `-linux.png` の CI Linux 撮影 + bot push + 空コミット再トリガー
- required status check（`playwright-smoke / smoke (chromium)` への sidebar-shell smoke 内包、`visual (sidebar-shell *)`）の PUT
- commit / push / PR 作成

## 本レビューサイクルの追加修正（2026-05-30）

実装レビューで以下の実バグ・dead code・dangling を検出し修正した（local typecheck / lint green、vitest shell+layout 45 passed）:

- **anonymous smoke/visual の mockApi 注入**: S1/S4/S5/S6・V1/V4/V6 の 7 ケースが `{ anonymousPage }` のみで mock API（127.0.0.1:8787）を起動せず、`/` が error boundary に落ちる実バグ。`{ anonymousPage, mockApi }` + `void mockApi` に修正。
- **`(member)/layout.spec.ts` 追従漏れ**: 旧仕様（`member-shell` / `data-shell="topbar"` / 同期 render）のまま 2 fail。`await Layout({children})` + SidebarShell mock の async パターンへ追従（admin / public spec は更新済みだった）。
- **`activePath` dead code 削除**: `middleware.ts` が `x-pathname` を注入せず `SidebarShell` も destructure しないため、props 型 / `SidebarShellServer` 引数 / 3 layout の `headers()` 取得を一掃。active 判定は client `usePathname()`（`SidebarNavItem`）が担う。
- **dead mock 除去**: `(admin|public)/layout.spec.tsx` の `vi.mock("next/headers")`。
- **システム仕様書 / skill 同期**: `09h-shell-and-fixtures.md`（§1 を旧 3 層独立 shell → 共通 SidebarShell に全面書換、§2-4 fixtures 無傷）/ `05-pages.md`（MemberHeader）/ `00-overview.md`・`09g-screen-blueprints-admin.md`（AdminSidebar）の dangling 解消。aiworkflow `lessons-learned-unified-sidebar-shell-2026-05.md`（L-USHELL-001..006）+ SKILL-changelog + 親 inventory / task-workflow-active の planned path 補正、task-spec-creator patterns に SP-USHELL-A..E 追記。

## 既知の調整・残課題

- `/login` は認証専用ページのため `(public)` シェル配下へは移動していない（親 Task C の理想 7 route のうち login のみ対象外）。
- visual regression dry-run（AC-6）は CI Linux baseline 確定後に実施（`maxDiffPixelRatio: 0.02`）。
- 親 `unified-sidebar-shell` workflow_state 昇格と Task A-F の completed-tasks 移動は親 close-out wave（本サイクルは Task F 文書のみ整合）。
