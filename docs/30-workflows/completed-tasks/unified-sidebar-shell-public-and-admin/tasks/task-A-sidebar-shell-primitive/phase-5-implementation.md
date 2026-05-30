---
Phase: 5
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-5-implementation.md
正本: ../task-A-sidebar-shell-primitive.md
---

# Phase 5 — 実装手順 (task A)

## 実装順序

1. `apps/web/src/styles/tokens.css` に 5 トークン追加（`--shell-bar-w` / `--shell-bar-w-collapsed` / `--shell-bar-bg` / `--shell-bar-border` / `--shell-active-bg` + `[data-theme='cool']` variant）
2. `shell-config.ts` 実装（`ShellRole` / `ShellNavItemId` / `ShellNavGroup` 型 + `buildNavForRole` / `isNavItemActive` 純関数）
3. `icons.tsx` 実装（`ShellNavItemId` map、純粋 SVG）
4. `useSidebarState.ts` 実装（`typeof window` ガード + `useEffect` で localStorage hydrate）
5. `SidebarBrand` / `SidebarNav` / `SidebarNavGroup` / `SidebarNavItem` / `SidebarCollapseToggle` 実装
6. `SidebarShellContext.tsx` 実装（drawer/collapse setter を context.Provider で供給）
7. `SidebarShell.tsx` 統合（aside + nav + slot 配置、props 受け取り）
8. `SidebarShell.server.tsx` 実装（`getSession()` 失敗時 role=viewer フォールバック、admin 時のみ `getSchemaDiffCount()` await）
9. 3 spec ファイル追加（Phase 4 で列挙したケースを GREEN 化）

## verify コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell
```

## CONST_005 充足

- 変更ファイル: artifacts.json `implementation_files` 15 件
- シグネチャ: phase-2 / 親 task-A.md の通り
- 入出力: `session`/`pathname` 入力 → nav render 出力、副作用 `localStorage` のみ
- DoD: phase-10 に再掲
