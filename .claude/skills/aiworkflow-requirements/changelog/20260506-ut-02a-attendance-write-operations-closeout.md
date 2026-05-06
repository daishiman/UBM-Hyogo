# 2026-05-06 UT-02A attendance write operations close-out

## Summary

`docs/30-workflows/completed-tasks/ut-02a-followup-001-attendance-write-operations/` を `implemented-local / resolved-by-existing-06cE-07c` として同期した。

## Canonical facts

- write 正本は `apps/api/src/repository/attendance.ts` の `addAttendance` / `removeAttendance`
- canonical route は `POST /admin/meetings/:sessionId/attendances`
- legacy route は `POST /admin/meetings/:sessionId/attendance` / `DELETE /admin/meetings/:sessionId/attendance/:memberId`
- duplicate は HTTP 409、deleted member は 422、session/member not found は 404
- 新規 `AttendanceWriter` / `AttendanceRecordId` は導入しない
- Phase 11 curl / UI smoke は `CONTRACT_ONLY_NOT_EXECUTED`。runtime evidence は 08b / 09a gate に委譲し、本 close-out では focused tests を実装証跡にする

## Synced files

- `references/task-workflow-active.md`
- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/task-ut-02a-attendance-write-operations-001.md`
- `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-001-attendance-write-operations.md`
- `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/outputs/phase-12/unassigned-task-detection.md`
