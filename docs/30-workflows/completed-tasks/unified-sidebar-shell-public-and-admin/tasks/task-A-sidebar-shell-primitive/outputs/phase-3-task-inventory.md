---
Phase: 3 (outputs)
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../../outputs/phase-3-task-inventory.md
---

# Phase 3 — Sub-task inventory (task A)

## 11 新規ファイル + 1 編集ファイル

### 新規（実装 11 + spec 3 = 14）

| # | path | 種別 |
|---|------|------|
| 1 | `apps/web/src/components/shell/shell-config.ts` | 純関数 |
| 2 | `apps/web/src/components/shell/icons.tsx` | 純粋 SVG map |
| 3 | `apps/web/src/components/shell/useSidebarState.ts` | Client hook |
| 4 | `apps/web/src/components/shell/SidebarShellContext.tsx` | Client context |
| 5 | `apps/web/src/components/shell/SidebarBrand.tsx` | Client |
| 6 | `apps/web/src/components/shell/SidebarNav.tsx` | Client |
| 7 | `apps/web/src/components/shell/SidebarNavGroup.tsx` | Client |
| 8 | `apps/web/src/components/shell/SidebarNavItem.tsx` | Client |
| 9 | `apps/web/src/components/shell/SidebarCollapseToggle.tsx` | Client |
| 10 | `apps/web/src/components/shell/SidebarShell.tsx` | Client root |
| 11 | `apps/web/src/components/shell/SidebarShell.server.tsx` | Server wrapper |
| 12 | `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | spec |
| 13 | `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx` | spec |
| 14 | `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | spec |

### 編集（1）

| # | path | 内容 |
|---|------|------|
| 1 | `apps/web/src/styles/tokens.css` | shell 用 OKLch トークン 5 件追加 |

## 依存順

`shell-config` / `icons` → `useSidebarState` → primitives (Brand/Nav/Item/Toggle) → `SidebarShellContext` → `SidebarShell` → `SidebarShell.server`
