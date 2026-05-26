# Workflow Artifact Inventory: Issue #911 meeting attendance unregister UI

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-911-meeting-attendance-unregister-ui-treat404-wiring/` |
| state | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 pending_user_approval` |
| source | Issue #911 (`Refs #911`; CLOSED issue auto-close wording is not used) |
| parent | `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/` |
| implementation | `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` |
| tests | `apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx` |
| API boundary | Existing `POST /api/admin/meetings/:id/attendances` with `{ memberId, attended: false }`; no `apps/api` or D1 schema diff |
| hook boundary | Existing `apps/web/src/features/admin/hooks/useAdminMutation.ts` `treat404AsSuccess` policy; hook itself unchanged |
| evidence | `outputs/phase-11/vitest-meeting-attendance-panel.log` (14 tests PASS), `vitest-use-admin-mutation.log` (33 tests PASS), `typecheck.log`, `lint.log`, `delete-race-callers.txt` (production caller 0 件) |
| Phase 12 | strict 7 files under `outputs/phase-12/`; `phase-12.md` is optional summary only |
| user gate | commit, push, PR, staging runtime smoke |

## Notes

- Issue #842 left the policy available while the caller remained POST-only. Issue #911 consumes that policy in the concrete meeting attendance unregister caller.
- Register and unregister use separate `useAdminMutation` instances so register-side 404 (`member_not_found` / `session_not_found`) remains failure while unregister-side 404 (`attendance_not_found`) converges to "already unregistered".
