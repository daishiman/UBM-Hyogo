# Phase 3: タスク分解とファイル俯瞰

## ファイル別 変更俯瞰

| ファイル | 種別 | 担当タスク |
|---------|------|-----------|
| `apps/web/src/components/shell/SidebarShell.tsx` | 新規 | A |
| `apps/web/src/components/shell/SidebarShell.server.tsx` | 新規 | A |
| `apps/web/src/components/shell/SidebarBrand.tsx` | 新規 | A |
| `apps/web/src/components/shell/SidebarNav.tsx` | 新規 | A |
| `apps/web/src/components/shell/SidebarNavGroup.tsx` | 新規 | A |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | 新規 | A |
| `apps/web/src/components/shell/SidebarCollapseToggle.tsx` | 新規 | A |
| `apps/web/src/components/shell/useSidebarState.ts` | 新規 | A |
| `apps/web/src/components/shell/shell-config.ts` | 新規 | A |
| `apps/web/src/components/shell/icons.tsx` | 新規 | A |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | 新規 | B |
| `apps/web/src/components/shell/SidebarUserAvatar.tsx` | 新規 | B |
| `apps/web/src/components/shell/user-menu-config.ts` | 新規 | B |
| `apps/web/src/components/shell/SidebarShellContext.tsx` | 新規 | E |
| `apps/web/src/components/shell/SidebarMobileTrigger.tsx` | 新規 | E |
| `apps/web/src/components/shell/SidebarDrawer.tsx` | 新規 | E |
| `apps/web/src/styles/tokens.css` | 編集 | A |
| `apps/web/app/(public)/layout.tsx` | 編集 | C |
| `apps/web/app/(member)/layout.tsx` | 編集 | C |
| `apps/web/app/(admin)/layout.tsx` | 編集 | D |
| `apps/web/src/components/layout/AdminSidebar.tsx` | 削除 | D |
| `apps/web/src/components/public/PublicHeader.tsx` | 削除 | C |
| `apps/web/src/components/public/SessionAwarePublicHeader.tsx` | 削除 | C |
| `apps/web/src/components/public/PublicHeaderWithPath.tsx` | 削除 | C |
| `apps/web/src/components/public/PublicFooter.tsx` | 保持 | – |
| `apps/web/src/components/layout/MemberHeader.tsx` | 削除 | C |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | 新規 | A |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | 新規 | B |
| `apps/web/src/components/shell/__tests__/user-menu-config.spec.ts` | 新規 | B |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | 新規 | A |
| `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx` | 新規 | A |
| `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | 新規 | E |
| `apps/web/tests/e2e/sidebar-shell-visual.spec.ts` | 新規 | F |
| `apps/web/tests/e2e/sidebar-shell-smoke.spec.ts` | 新規 | F |

合計: 新規 25 / 編集 4 / 削除 5

## 削除タイミング

- 旧 component の削除は**各統合タスク（C / D）の最後のステップ**で実施
- Task A 完了時点では旧 component は残置（C / D が完了するまで参照される）

## 並列スケジュール

```
時系列 →
[A: primitive]──────────┐
[B: UserMenu]───────────┤
                        ├─[C: public/member 統合]──┐
[E: mobile drawer]──────┘                          ├─[F: visual + smoke]
                        └─[D: admin 移行]──────────┘
```

A と B と E（A の interface 確定後）は並列、C と D は A+B+E 完了後に並列、最後に F。

## 全タスク共通の検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/web test --run
mise exec -- pnpm --filter @ubm/web exec playwright test sidebar-shell-smoke
```
