# Phase 11 Discovered Issues

No unresolved local implementation issues were found.

Runtime screenshot capture remains pending user approval and is tracked as a Phase 13/runtime boundary, not as an unassigned task.

## Closed in Review Cycle

| Issue | Resolution |
| --- | --- |
| 1x1 screenshot placeholders could be misread as runtime evidence | Removed from evidence status; Phase 11/12 now state runtime screenshots are pending and placeholders are not evidence. |
| Focused h1 had no visible focus indicator | `apps/web/app/login/error.tsx` now uses an outline on focus so programmatic focus is also visually inspectable. |
