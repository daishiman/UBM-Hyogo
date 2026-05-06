# Phase 4 Test Matrix

See `outputs/phase-04/main.md`.

追加確認:

| case | evidence |
| --- | --- |
| duplicate route status | existing `apps/api/src/routes/admin/attendance.test.ts` / `meetings.test.ts` |
| read-after-write | existing `apps/api/src/repository/__tests__/attendance-provider.test.ts` |
| no `AttendanceRecordId` write abstraction | grep / typecheck |
