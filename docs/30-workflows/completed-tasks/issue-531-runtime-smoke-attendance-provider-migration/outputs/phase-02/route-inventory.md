# Route Inventory

Source verified against:

- `apps/api/src/routes/admin/members.ts`
- `apps/api/src/routes/me/index.ts`

| method | path | source line | runtime smoke | DI-bound evidence | contract assertion |
| --- | --- | ---: | --- | --- | --- |
| GET | `/admin/members` | 212 | yes | no - middleware mounted, but response does not hydrate attendance via `c.var.attendanceProvider` | `.members` is array |
| GET | `/admin/members/:memberId` | 305 | yes | yes - `buildAdminMemberDetailView(... c.var.attendanceProvider ...)` | `.attendance` is array |
| GET | `/admin/members/:memberId/attendance` | 336 | yes | no - uses route-local `createAttendanceProvider(db)` paging path | `.records` is array |
| GET | `/me/` | 72 | yes | no - session response only | `.user.memberId` is string |
| GET | `/me/profile` | 90 | yes | yes - `buildMemberProfile(... c.var.attendanceProvider ...)` | `.profile.attendance` is array |
| GET | `/me/attendance` | 122 | yes | no - uses route-local `createAttendanceProvider(ctx)` paging path | `.records` is array |
| POST | `/me/visibility-request` | 163 | no | no - DB write route, inventory only | DB write route, inventory only |
| POST | `/me/delete-request` | 199 | no | no - DB write route, inventory only | DB write route, inventory only |

Read-only GET smoke is the canonical runtime evidence for this task. DI-bound evidence is limited to `/admin/members/:memberId` and `/me/profile`; the other GET routes remain useful route availability and attendance paging contract checks but must not be described as direct `c.var.attendanceProvider` evidence. POST routes are intentionally excluded because successful execution mutates staging queue state.
