# Documentation Changelog — issue-912

## 2026-05-25

- Created `docs/30-workflows/issue-912-idempotent-attendance-remove-retry/` with Phase 1-13 + artifacts.json + outputs/phase-N
- Documented finding that DELETE `/meetings/:sessionId/attendance/:memberId` is already in `apps/api/src/routes/admin/attendance.ts:177-199` (naturally idempotent), enabling the source one-pager's §3.4 trigger condition to be met within this cycle
- Specified `attendanceMutation` split into `addAttendanceMutation` (POST, mutationFn 維持) and `removeAttendanceMutation` (DELETE, retry + idempotencyKey opt-in)
- Implemented apps/web changes and captured focused Vitest evidence (`3 passed / 97 tests`)
- Synced workflow state from `spec_ready_awaiting_implementation` to `implemented_local_evidence_captured`

## Future

- staging/production curl, commit, push, PR are user-gated and will be tracked in follow-up entries when executed
