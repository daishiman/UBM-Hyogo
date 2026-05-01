# Phase 8: Naming And Duplication Review

## Naming Decision

| Target | Adopted | Rejected |
| --- | --- | --- |
| Repository file | `adminNotes.ts` | `adminMemberNotes.ts` |
| Row type | `AdminMemberNoteRow` | audit-shaped DTO as row |
| Read API | `listByMemberId` | `listAdminNotesByMemberId` duplicate |
| SQL columns | `SELECT_COLS` | repeated select fragments |

## Duplication Review

`apps/api/src/repository/adminNotes.ts` is the only canonical repository for `admin_member_notes`. No duplicate repository file was created.

## Completion

DTO and DB row responsibilities remain separated. The Phase 12 guide records the legacy candidate name difference.
