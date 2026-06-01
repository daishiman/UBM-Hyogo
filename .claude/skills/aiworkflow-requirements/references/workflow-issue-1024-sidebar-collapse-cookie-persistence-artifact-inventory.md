# Workflow Artifact Inventory: issue-1024-sidebar-collapse-cookie-persistence

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/artifacts.json` |
| Phase 11 summary | `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 13 placeholders | `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/phase-13/{local-check-result,change-summary,pr-info,pr-creation-result}.md` |
| source unassigned | `docs/30-workflows/unassigned-task/unified-sidebar-shell-public-and-admin-followup-001-sidebar-collapse-cookie-persistence.md` |
| source detection | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/phase-12/unassigned-task-detection.md` |
| implementation target | `apps/web/src/components/shell/shell-collapse-cookie.ts` |
| implementation target | `apps/web/src/components/shell/useSidebarState.ts` |
| implementation target | `apps/web/src/components/shell/SidebarShell.tsx` |
| implementation target | `apps/web/src/components/shell/SidebarShell.server.tsx` |
| test targets | `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`, `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx`, `apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx` |

Status: `implemented_local_evidence_captured / implementation / NON_VISUAL`.

Boundary: `ubm_shell_collapsed` stores only a non-secret UI preference. API endpoints, D1 schema, Google Form schema, auth middleware, design tokens, and route topology are unchanged. Commit, push, PR, remote CI, staging observation, and GitHub Issue mutation are user-gated.

## Lessons Learned

- [[lessons-learned-issue-1024-sidebar-collapse-cookie-persistence-2026-05]] — L-I1024-001..003:
  - L-I1024-001: UI state that affects first paint should use a server-readable seed when persistence is required; cookie fits collapse state better than client-only storage.
  - L-I1024-002: Avoid split-token lint bypasses such as `"local" + "Storage"`; replace the mechanism with one that satisfies the boundary rule directly.
  - L-I1024-003: Keep the state owner single (`useSidebarState`) and pass the server seed as an optional initial value instead of adding a second store.

