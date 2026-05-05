# Schema Ownership

| Scope | Owner | Rule |
| --- | --- | --- |
| `apps/api/src/repository/attendance/**` | This task | New read repository |
| `apps/api/src/repository/_shared/builder.ts` attendance injection | This task | Do not alter 02a identity/status/response behavior |
| `apps/api/src/repository/_shared/branded-types/meeting.ts` | This task | New meeting/attendance brands only |
| `apps/api/migrations/*.sql` | 02b preferred | File a schema diff task if required columns or indexes are absent |
| `AttendanceRecord` shape | 02a contract | No breaking interface changes |
