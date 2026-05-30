---
Phase: 2 (outputs)
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../../outputs/phase-2-architecture.md
---

# Phase 2 — Architecture (task A)

## Client / Server 境界

```
[(layout server)] ──> SidebarShell.server.tsx (Server)
                              │ getSession()
                              │ role = viewer | member | admin
                              │ buildNavForRole(role, ctx) [pure]
                              │ user = { displayName, email, initials } | null
                              ▼
                       SidebarShell (Client)
                       ├── SidebarBrand
                       ├── SidebarNav
                       │    └── SidebarNavGroup
                       │         └── SidebarNavItem (aria-current)
                       ├── SidebarCollapseToggle (aria-expanded)
                       └── { mobileTriggerSlot }   ← Task E が後で挿入
```

## Context Flow

`SidebarShellContext` は drawer/collapse setter のみ公開。`useSidebarState` の戻り値を Provider value にラップし、`useMemo` で stable に保つ。

## localStorage persistence

- key: `ubm:shell:collapsed`
- value: JSON boolean
- read: マウント時の `useEffect` 内（SSR では `typeof window === 'undefined'` で skip）
- write: `toggleCollapsed` 内、`setItem` 失敗（quota / private mode）は try/catch で握る

## a11y 規約

| 要素 | 属性 |
|------|------|
| `<aside>` | role 自明、`aria-label="サイドバー"` を持つ `<nav>` 内包 |
| collapse toggle button | `aria-expanded={mode === 'expanded'}` |
| active nav item | `aria-current="page"` |
| collapsed 時 label | `<span class="sr-only">` |
