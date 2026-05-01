# Phase 1: Requirements Confirmation

## P50 Implementation Check

- Existing implementation: `apps/api/src/repository/adminNotes.ts`.
- Canonical repository name: `adminNotes.ts`; do not create duplicate `adminMemberNotes.ts`.
- Existing read API: `listByMemberId(c, memberId)`.
- Existing DDL references: `admin_member_notes` in `docs/00-getting-started-manual/specs/08-free-database.md`, plus migrations `0006` and `0007`.
- Workflow scope conflict resolved for this execution: the spec was originally `docsOnly: true`, but the user explicitly requested code and test implementation. Code changes are therefore limited to test coverage around existing canonical implementation.

## Spec Extraction Map

| Source | Confirmed Requirement |
| --- | --- |
| `index.md` | AC-1 to AC-11 define read repository, non-leak, ordering, empty result, and 04c handoff |
| `phase-01.md` | Existing implementation must be detected before implementation |
| `08-free-database.md` | `admin_member_notes` columns and indexes are present |
| `database-admin-repository-boundary.md` | `adminNotes.ts` owns admin notes and must not leak to public/member view models |

## AC List

Core AC for this task: AC-1, AC-3, AC-4, AC-5, AC-6, AC-8.
Guardrails: AC-2, AC-7, AC-11.
Handoff: AC-9, AC-10.

## Completion

- Existing implementation state: implemented.
- DDL and indexes: confirmed.
- Invariants #11 and #12 carried to Phase 2.
