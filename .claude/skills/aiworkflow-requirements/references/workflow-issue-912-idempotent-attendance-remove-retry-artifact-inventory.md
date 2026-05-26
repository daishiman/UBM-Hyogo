# Workflow Artifact Inventory — issue-912-idempotent-attendance-remove-retry

| item | path |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-912-idempotent-attendance-remove-retry/` |
| root index | `docs/30-workflows/completed-tasks/issue-912-idempotent-attendance-remove-retry/index.md` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-912-idempotent-attendance-remove-retry/artifacts.json` |
| Phase 11 summary | `docs/30-workflows/completed-tasks/issue-912-idempotent-attendance-remove-retry/outputs/phase-11/main.md` |
| Phase 11 canonical paths | `docs/30-workflows/completed-tasks/issue-912-idempotent-attendance-remove-retry/outputs/phase-11/canonical-paths.json` |
| Phase 11 focused Vitest evidence | `docs/30-workflows/completed-tasks/issue-912-idempotent-attendance-remove-retry/outputs/phase-11/evidence/focused-vitest.log` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-912-idempotent-attendance-remove-retry/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Classification

`implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval`.

## Implementation Targets

| target | change |
| --- | --- |
| `apps/web/src/lib/admin/api.ts` | `removeAttendance` switched from POST alias to existing DELETE `/meetings/:sessionId/attendance/:memberId` |
| `apps/web/src/components/admin/MeetingPanel.tsx` | attendance mutation split into POST add and DELETE remove; remove opts into retry + `Idempotency-Key` |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | helper route assertion updated |
| `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx` | DELETE retry / header / 4xx no-retry / 404 race regression coverage |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | hook policy regression evidence |

## Boundaries

- `apps/api/src/routes/admin/attendance.ts` unchanged; existing DELETE endpoint reused.
- `apps/web/src/features/admin/hooks/useAdminMutation.ts` unchanged; existing hook policy reused.
- D1 schema, shared schemas, and public/member routes unchanged.
- Commit, push, PR, Issue mutation, staging curl, and production verification remain user-gated.
