# 2026-05-25 issue912 idempotent attendance remove retry

- Synced `docs/30-workflows/completed-tasks/issue-912-idempotent-attendance-remove-retry/` as `implemented_local_evidence_captured / implementation / NON_VISUAL`.
- Implemented `apps/web/src/lib/admin/api.ts` `removeAttendance` DELETE route and `MeetingPanel.tsx` add/remove mutation split.
- Captured focused Vitest evidence: `api.spec.ts`, `MeetingPanel.component.spec.tsx`, `useAdminMutation.spec.ts` (97 tests PASS).
- Added artifact inventory and lessons L-I912-001..005.
- Commit, push, PR, staging runtime curl, and Issue mutation remain user-gated.
