# Documentation Changelog — admin-layout-sidebar-shell-migration

## 2026-05-29 (review: spec_created → implemented_local_runtime_pending 整合)

### Added (code — Task A/B/D/E 一括実装)

- `apps/web/src/components/shell/`（15 component + 6 spec: shell-config / icons / useSidebarState / SidebarShellContext / SidebarNav* / SidebarBrand / SidebarCollapseToggle / SidebarShell(.server) / SidebarUser* / user-menu-config / SidebarMobileTrigger）
- `apps/web/src/lib/admin/schema-diff-count.ts` / `schema-diff-count.spec.ts`（TECH-M-01 SSOT）
- `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/implementation-summary.md`

### Changed (code)

- `apps/web/app/(admin)/layout.tsx`: 旧 `AdminSidebar` 撤去 → `SidebarShellServer` 委譲（auth guard + admin shell DOM contract + `<main data-route="admin">` 維持）
- `apps/web/app/(admin)/layout.spec.tsx`: Phase 4 マトリクス（TC-01/02/03/07/08）へ書き換え
- `apps/web/src/styles/tokens.css`: shell トークン 6 件（`--shell-bar-w` 等 + cool テーマ `--shell-active-bg`）

### Deleted (code)

- `apps/web/src/components/layout/AdminSidebar.tsx` / `AdminSidebarNavItem.tsx` / `AdminBrandBlock.tsx` + spec 3 件（AC-2 grep gate = 0 hit）

### Updated (docs / spec — 本レビューで実態へ整合)

- `index.md`: frontmatter `status` / `workflow_state` を `implemented_local_runtime_pending` へ + 実装完了記録セクション追加
- `artifacts.json` / `outputs/artifacts.json`: `workflow_state` / `phases[].state` / gates（`metadata.gates` 準拠スキーマ）/ implementation_files / verification を実態へ更新
- `phase-12.md`: workflow_state 行を implemented へ更新
- `outputs/phase-12/{main,system-spec-update-summary,unassigned-task-detection,implementation-guide,phase12-task-spec-compliance-check}.md`: spec_created 表記を implemented へ書き換え。implementation-guide の stale code sample（`session.user.isAdmin` / `role="admin"` prop / `safeServerFetch` シグネチャ）を実コードへ修正
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `references/task-workflow-active.md` / artifact inventory: implemented state + 実 targets へ更新

### Not Changed

- Domain specs: API endpoint / D1 schema / IPC / auth mechanism / Cloudflare bindings は不変。

## Validator Notes

- `pnpm typecheck`: PASS（6/6 workspaces Done）
- `pnpm lint`: PASS
- web Vitest: 188 files / 1299 passed / 1 skipped
- `git grep -l components/layout/AdminSidebar`: 0 hit
- `verify:phase12-compliance`: PASS（admin-layout root ok）
- `gate-metadata:validate`: ERROR 0
- Runtime visual evidence: pending（user-gated staging）
