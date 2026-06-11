# admin-sidebar-collapsed-icon-spacing-parity sync

Synchronized `admin-sidebar-collapsed-icon-spacing-parity` as
`implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION / staging_visual_pending_user_gate`.

- Implemented collapsed nav/public-return icon-box parity in `apps/web/src/components/shell/SidebarNavItem.tsx` and `SidebarShell.tsx`: `h-10 w-10` -> `h-[18px] w-10`.
- Updated focused shell specs to assert nav/public-return `h-[18px]` while preserving brand/user avatar `h-10`.
- Verified focused Vitest 2 files / 20 tests PASS, web typecheck PASS, web lint PASS, design-token gate 9 tests PASS, apps/api diff empty.
- Added local visual capture routes/spec for collapsed/expanded/footer screenshots. PNG capture is not present yet: the Playwright run was blocked before test execution because Next dev webServer did not return `/visual-harness/admin-sidebar-spacing-collapsed` within timeout.
- Registered workflow root, artifact inventory, quick-reference, resource-map, and task-workflow-active entries.
- Preserved user-gated boundaries: staging authenticated screenshots, commit, push, PR. API, D1 schema, Google Form, auth, route topology, and `ShellIcon` glyph dimensions are unchanged.
