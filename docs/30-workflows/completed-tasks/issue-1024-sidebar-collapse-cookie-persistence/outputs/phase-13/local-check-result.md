# Local Check Result — issue-1024

Status: `blocked_user_gate_after_local_checks`

Local implementation checks are owned by Phase 11 / Phase 12 evidence. Commit, push, PR, remote CI, and Issue mutation are not executed without explicit user approval.

Required local checks before PR:

- `pnpm exec vitest run --config vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx`
- `pnpm --filter @ubm-hyogo/web lint`
- `node .claude/skills/task-specification-creator/scripts/validate-schema.js --schema .claude/skills/task-specification-creator/schemas/artifact-definition.json --data docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/artifacts.json`

