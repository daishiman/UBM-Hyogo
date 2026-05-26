# Manual Smoke Log — issue-912

## Status

NON_VISUAL local smoke completed through focused Vitest.

## Local Evidence

| Check | Result | Evidence |
|---|---|---|
| `removeAttendance` helper uses DELETE route | PASS | `outputs/phase-11/evidence/focused-vitest.log` (`api.spec.ts`) |
| `MeetingPanel` remove path uses hook fetch route, not `mutationFn` | PASS | `outputs/phase-11/evidence/focused-vitest.log` (`MeetingPanel.component.spec.tsx`) |
| 5xx retry reaches 3 fetch attempts | PASS | `outputs/phase-11/evidence/focused-vitest.log` |
| `Idempotency-Key` header is present on attempts | PASS | `outputs/phase-11/evidence/focused-vitest.log` |
| 4xx does not retry | PASS | `outputs/phase-11/evidence/focused-vitest.log` |
| 404 race keeps existing optimistic removal behavior | PASS | `outputs/phase-11/evidence/focused-vitest.log` |

## Runtime Boundary

Staging/production curl and DevTools Network evidence remain user-gated and are not claimed as completed.
