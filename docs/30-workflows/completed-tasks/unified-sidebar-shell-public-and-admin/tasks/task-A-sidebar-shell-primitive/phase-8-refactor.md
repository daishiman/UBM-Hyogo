---
Phase: 8
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-8-refactor.md
---

# Phase 8 — リファクタ (task A)

## 方針

| 項目 | 内容 |
|------|------|
| className 重複抽出 | `SidebarNavItem` / `SidebarBrand` で同一 hover / active class を `cn()` ヘルパ + module-local const にまとめる |
| icon サイズ統一 | 全 icon を `w-5 h-5` 固定 props 経由で受け取り、collapsed 時のみ `w-6 h-6` に拡大する分岐は親 component に集約 |
| context purity | `SidebarShellContext` の value object は `useMemo` 経由で安定化、不要な re-render を防止 |
| 命名 | hook 内 state は `mode` (expanded/collapsed) と `drawerOpen` で意味を分離。略語禁止 |

## 制約

- public API シグネチャ（`SidebarShellProps` / `buildNavForRole`）は変更しない
- 3 spec が引き続き GREEN を保つこと
