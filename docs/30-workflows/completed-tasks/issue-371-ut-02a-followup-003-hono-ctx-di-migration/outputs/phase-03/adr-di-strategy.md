# ADR: repository provider injection strategy

- Date: 2026-05-06
- Status: Proposed for implementation
- Task: issue-371-ut-02a-followup-003-hono-ctx-di-migration

## Context

UT-02A introduced `AttendanceProvider` and temporarily passed it to profile builders as optional `deps?`.
That kept the original implementation small, but it also left two architectural problems:

- every new repository dependency expands builder signatures and route call sites
- missing provider wiring can silently fall back to `attendance: []`

The target API contract is unchanged: `MemberProfile.attendance` remains `AttendanceRecord[]`, and D1 schema / public response shape are out of scope.

## Decision

Adopt Hono context injection for the existing `AttendanceProvider` only:

- `attendanceProviderMiddleware` binds `createAttendanceProvider(c)` with `c.set("attendanceProvider", provider)`
- `buildMemberProfile(c, mid)` and `buildAdminMemberDetailView(c, mid, adminNotes)` resolve from `c.var.attendanceProvider`
- missing provider binding throws `Error("attendanceProvider not bound to context")`

Do not introduce a general DI framework or new write/tag/note provider abstractions in this task.

## Alternatives

| Alternative | Result | Reason |
| --- | --- | --- |
| Keep optional builder argument | Rejected | Small today, but it keeps call-site growth and silent fallback risk. |
| Hono context provider | Accepted | Matches existing Hono middleware model, removes builder signature growth, and is easy to test by setting `c.var`. |
| DI container | Rejected | More abstraction than this single-provider migration needs. It would add a second dependency-resolution model before the project has enough pressure to justify it. |

## Consequences

- Route groups using the builders must mount the provider middleware.
- Tests that need mocks should set `attendanceProvider` on the Hono context or use a fixture middleware.
- Future providers may reuse the same middleware/context pattern after a separate task proves the need.
- Runtime evidence remains pending until the implementation cycle creates logs under `outputs/phase-11/evidence/`.
