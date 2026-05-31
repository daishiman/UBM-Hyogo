# Phase 5 実装サマリ — unified-sidebar-shell（Task A〜E）+ Task F

> 実行日: 2026-05-29
> このサマリは本実行サイクルで実コードベースに加えた変更の記録。
> Task F は親 Task A〜E 完了が前提のため、本サイクルで A〜E を先行実装してから Task F を実装した
> （ユーザー指示「親 A-E から全実装」による）。

## 1. 背景・判断根拠

Task F の仕様（`sidebar-shell-visual-baseline-smoke-task-f`）は親 workflow
`unified-sidebar-shell-public-and-admin` の Task A〜E（共通 collapsible Sidebar Shell）の
実装完了を前提とする。着手時点でこの worktree には:

- `apps/web/src/components/shell/` が**存在しなかった**
- `data-testid="app-shell"` 等の shell selector が src 全体に**1 件も存在しなかった**
- 親 workflow は `workflow_state: spec_created`（実装未着手）

そのため Task F 単独では smoke / visual が全件失敗する状態だった。CONST_009 に基づきユーザーへ
エスカレーションし、「親 A-E から全実装」の指示を受けて以下を実装した。

## 2. 実装内容

### Task A — SidebarShell primitive

新規（`apps/web/src/components/shell/`）:
- `shell-config.ts` — `ShellRole` / nav 型 / `buildNavForRole` / `isNavItemActive`（純関数）
- `icons.tsx` — nav / 操作用 svg（AdminSidebar のアイコンパスを再利用）
- `useSidebarState.ts` — collapse/drawer state、`ubm:shell:collapsed` 永続化、route 変化 auto-close
- `SidebarShellContext.tsx` — drawer/collapse setter の context
- `SidebarBrand.tsx` / `SidebarNav.tsx` / `SidebarNavGroup.tsx` / `SidebarNavItem.tsx` / `SidebarCollapseToggle.tsx`
- `SidebarShell.tsx`（client）— shell 合成（aside + main + mobile strip + drawer）
- `SidebarShell.server.tsx` — `getSession()` → role 判定 → `buildNavForRole()` → admin 時 schemaDiffCount await
- `tokens.css` に shell トークン 5 件追加（`--shell-bar-w` 等）

### Task B — SidebarUserMenu

- `user-menu-config.ts` — `buildUserMenuActions`（viewer/member/admin の action 集合）
- `SidebarUserAvatar.tsx` — initials + admin badge dot
- `SidebarUserMenu.tsx` — `<details>` popover（viewer は直接ログインリンク）、route 変化 auto-close、`SignOutButton` embed

### Task E — Mobile drawer

- `SidebarMobileTrigger.tsx` — hamburger（md:hidden）
- `SidebarDrawer.tsx` — `role="dialog"` overlay、Esc / backdrop close、body scroll-lock

### Task C — 公開 / 会員 layout 統合

- `app/(public)/layout.tsx` / `app/(member)/layout.tsx` を async server 化し `SidebarShellServer` へ委譲
- ルート再配置（重要）: `/`・`/privacy`・`/terms` は `app/` 直下にあり `(public)` シェル layout 外だったため、
  `app/(public)/page.tsx`・`app/(public)/privacy/`・`app/(public)/terms/` へ移動してシェル配下に収めた
- `app/(public)/page.tsx`（旧 `/`）・`app/(member)/profile/page.tsx` から旧 `PublicHeader` / `PublicFooter` / `MemberHeader` の直接描画を撤去
- 旧コンポーネント削除: `PublicHeader.tsx` / `MemberHeader.tsx`（+ 各 spec）

### Task D — Admin layout 移行

- `app/(admin)/layout.tsx` を `SidebarShellServer` ベースへ。schemaDiffCount 取得は shell server に集約
- 旧 `AdminSidebar.tsx` 削除（+ spec 2 本）。redirect 文字列（`/login?next=/admin`・`/login?gate=forbidden`）は既存挙動を維持

### Task F — Playwright baseline / smoke / CI

- `apps/web/playwright/tests/sidebar-shell/_helpers.ts`
- `apps/web/playwright/tests/sidebar-shell/sidebar-shell-smoke.spec.ts`（S1〜S6）
- `apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts`（V1〜V7）
- `apps/web/playwright.config.ts` に project 4 件追加 + 既存 default project の testIgnore に `sidebar-shell/`
- `.github/workflows/playwright-smoke.yml` に smoke step + `sidebar-shell-visual` matrix job 追加

## 3. 仕様からの調整（DOM 契約）

Task F phase-5-implementation.md の selector を実装に合わせて確定した（同 spec が「Phase 5 着手時に実値で確定」と許容）:

| 項目 | spec 草案 | 実装で確定 |
| --- | --- | --- |
| nav 件数アンカー | `[data-testid="shell-sidebar"] a` | `[data-testid="shell-nav"] a`（brand / user-menu の anchor を除外して厳密 13） |
| user menu 開閉 | `shell-user-menu` click | `[data-testid="shell-user-menu"] summary` click（`<details>` 契約） |
| collapse key | `ubm.shell.sidebar-collapsed`（草案） | `ubm:shell:collapsed`（親 Task A 正本） |
| S2 action ラベル | 「編集申請」 | 「プロフィール編集申請」（Task B 正本、smoke は部分一致で検証） |
| S6 drawer link | 「メンバー」 | 「会員ディレクトリ」（統合 nav の実ラベル） |

`/login` は認証専用ページのため `(public)` シェル配下へは移動していない（親 Task C の理想 7 route のうち
login のみ意図的に対象外。シェルを被せると認証導線が二重になるため）。

## 4. ローカル検証結果

| コマンド | 結果 |
| --- | --- |
| `pnpm --filter @ubm-hyogo/web typecheck` | ✅ green |
| `pnpm --filter @ubm-hyogo/web lint` | ✅ green（`isBrowser()` guard 適用後） |
| `tsx scripts/verify-design-tokens.ts` | ✅ `design tokens in sync (91 tracked)` |
| shell + layout + profile unit specs（vitest） | ✅ 44 passed |
| layout 孤立 spec（AdminSidebarNavItem 等） | ✅ 18 passed |
| `playwright test --project=sidebar-shell-* --list` | ✅ 27 tests 認識（smoke 6 + visual 7×3） |

smoke / visual の実 run 結果は phase-11 evidence を参照。
