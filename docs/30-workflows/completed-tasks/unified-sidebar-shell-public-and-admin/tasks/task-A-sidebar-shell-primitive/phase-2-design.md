---
Phase: 2
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-2-design.md
---

# Phase 2 — 設計 (task A)

## 責務分担表

| ファイル | 種別 | 責務 |
|---------|------|------|
| `shell-config.ts` | 純関数 | role → nav groups 生成、active 判定 |
| `icons.tsx` | 純関数 | `ShellNavItemId` → SVG コンポーネント map |
| `useSidebarState.ts` | Client hook | `mode` / `drawerOpen` 状態 + localStorage 永続化 + SSR safe |
| `SidebarShellContext.tsx` | Client context | drawer/collapse setter を子孫へ供給 |
| `SidebarShell.tsx` | Client | layout + collapsible aside + nav 配置、`mobileTriggerSlot` を slot 描画 |
| `SidebarShell.server.tsx` | Server | `getSession()` → role 判定 → `buildNavForRole()` → `SidebarShell` props 組立 |
| `SidebarBrand.tsx` | Client | 折り畳み状態に応じた logo / 略称切替 |
| `SidebarNav.tsx` / `SidebarNavGroup.tsx` / `SidebarNavItem.tsx` | Client | nav 描画 + `aria-current` |
| `SidebarCollapseToggle.tsx` | Client | toggle button + `aria-expanded` |

## shell-config 型シグネチャ（再掲・正本は task-A.md）

```ts
type ShellRole = 'viewer' | 'member' | 'admin'
function buildNavForRole(role: ShellRole, ctx?: { schemaDiffCount?: number }): ShellNavGroup[]
function isNavItemActive(itemHref: string, pathname: string): boolean
```

## tokens.css 追加 5 トークン

`--shell-bar-w` / `--shell-bar-w-collapsed` / `--shell-bar-bg` / `--shell-bar-border` / `--shell-active-bg` (`[data-theme='cool']` variant 含む)。

## Client/Server 境界

`SidebarShell.server.tsx` 内のみ `getSession()` を呼び、結果を JSON-serializable な `user` / `role` / `navGroups` に変換して Client `SidebarShell` に渡す。Client 側で session を直接見ない。
