# [#1022] Unified Sidebar Shell Task B: User menu and role handling

## メタ情報

```yaml
issue_number: 1022
title: Unified Sidebar Shell Task B: User menu and role handling
state: OPEN
priority: 中
scale: 中規模
category: feature
status: 未実施
created_date: 2026-05-29
updated_date: 2026-05-29
url: https://github.com/daishiman/UBM-Hyogo/issues/1022
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## Summary
Implement Task B for the unified sidebar shell: `SidebarUserMenu`, role-aware avatar/actions, and SignOutButton reuse.

## Spec
- Local task spec: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-B-user-menu-and-role-handling.md`
- Implementation guide: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/implementation-guide.md`

## Scope
- Add `apps/web/src/components/shell/SidebarUserMenu.tsx` and user-menu action config.
- Add focused tests for viewer/member/admin action sets and collapsed labels.
- Reuse existing `SignOutButton`; do not create a new logout implementation.

## Acceptance Criteria
- Viewer shows only login action.
- Member shows profile, edit request, and logout actions.
- Admin shows profile, edit request, admin dashboard, and logout actions.
- `SidebarShellServer` can inject/render the menu after role resolution.
- Focused tests pass with `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarUserMenu`.

## Struggle Notes
- The parent workflow intentionally separates implementation execution from Phase-12 documentation close-out. Avoid marking visual/runtime evidence as complete in this issue.
- Role vocabulary must stay fixed to `viewer` / `member` / `admin`; do not infer admin from URL prefix or email allowlists.

Refs: unified-sidebar-shell-public-and-admin Phase 12 implementation guide.
