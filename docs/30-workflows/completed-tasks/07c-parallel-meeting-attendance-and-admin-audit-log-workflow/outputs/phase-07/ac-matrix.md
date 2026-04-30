# AC Matrix Detail

| AC | Invariant | Failure Case | File |
| --- | --- | --- | --- |
| AC-1 | #15 | duplicate/race | `apps/api/src/repository/attendance.ts`, `apps/api/src/routes/admin/attendance.ts` |
| AC-2 | #7/#15 | deleted member | `listAttendableMembers` |
| AC-3 | #5 | successful admin mutation | `auditLog.append` calls |
| AC-4 | #11 | restore/replay audit | `before_json`, `after_json` |
| AC-5 | #15 | delete existing/missing | `removeAttendance` |
| AC-6 | #11 | route not found | no new profile mutation |
| AC-7 | #15 | app/DB drift | D1 PK + API gate |
