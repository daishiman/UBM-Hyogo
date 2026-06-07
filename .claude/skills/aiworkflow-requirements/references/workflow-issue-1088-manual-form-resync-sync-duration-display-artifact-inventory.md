# Workflow Artifact Inventory: issue-1088-manual-form-resync-sync-duration-display

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1088-manual-form-resync-sync-duration-display/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1088-manual-form-resync-sync-duration-display/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/issue-1088-manual-form-resync-sync-duration-display/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/issue-1088-manual-form-resync-sync-duration-display/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-1088-manual-form-resync-sync-duration-display/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| implementation guide | `docs/30-workflows/completed-tasks/issue-1088-manual-form-resync-sync-duration-display/outputs/phase-12/implementation-guide.md` |
| source issue | GitHub Issue #1088 |
| consumed unassigned spec | `docs/30-workflows/completed-tasks/task-b-manual-form-resync-followup-001-sync-duration-display.md` |
| parent workflow | `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/` |

## Code Artifacts

| Area | Path | Notes |
| --- | --- | --- |
| backend producer | `apps/api/src/jobs/sync-forms-responses.ts` | `ResponseSyncResult.durationMs` and `runResponseSync()` 3 return paths |
| backend job contract tests | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | succeeded / failed / skipped durationMs coverage |
| backend route contract tests | `apps/api/src/routes/admin/responses-sync.contract.spec.ts` | route pass-through with durationMs |
| frontend schema | `apps/web/src/features/admin/diagnostics/manual-sync.ts` | optional `durationMs` while `.strict()` remains |
| frontend schema tests | `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | durationMs present / absent / invalid coverage |
| frontend UI | `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | result `<dl>` durationMs row |
| frontend UI tests | `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx` | value display and fallback coverage |

## Evidence Boundary

Local evidence is captured by focused Vitest, API/web typecheck, and repo lint. Authenticated runtime screenshot capture requires admin browser state, `SYNC_ADMIN_TOKEN` runtime provisioning, and a live resync execution, so it remains user-gated.

## Lessons Learned

- L-I1088-001: For fields added to an existing response payload, pin the producer to the concrete current return type and function (`ResponseSyncResult` / `runResponseSync`) before editing UI schema. Vague issue wording such as "sync use-case" can point at adjacent wrappers that do not serve the target route.
- L-I1088-002: UI zod schemas that are `.strict()` should add newly produced fields before or with backend payload expansion; using optional consumer fields preserves compatibility while keeping unknown-key rejection.
- L-I1088-003: VISUAL_ON_EXECUTION tasks can be locally complete through DOM-focused tests when real screenshot capture requires authenticated runtime side effects; record screenshot as Gate-C user-gated, not as missing implementation.
