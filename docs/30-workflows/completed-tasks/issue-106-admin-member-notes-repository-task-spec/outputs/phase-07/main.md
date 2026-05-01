# Phase 7: AC Matrix

| AC | Classification | Implementation Anchor | Verification Anchor | Status |
| --- | --- | --- | --- | --- |
| AC-1 | Core | `adminNotes.listByMemberId` | typecheck/test | covered |
| AC-2 | Guardrail | public/member view models | type-level assertion and public tests | covered |
| AC-3 | Core | `_shared/db`, `_shared/brand` imports | code review/static grep | covered |
| AC-4 | Core | `WHERE member_id = ?1` | new isolation test | covered |
| AC-5 | Core | `ORDER BY created_at DESC` | new ordering test | covered |
| AC-6 | Core | empty result mapping | new unknown member test | covered |
| AC-7 | Guardrail | no response table writes | static grep | covered |
| AC-8 | Core | repository unit tests | vitest | covered |
| AC-9 | Handoff | 04c admin consumers | `member-notes.ts` route | delegated with anchor |
| AC-10 | Handoff | mutation route + audit append | `member-notes.test.ts` | delegated with anchor |
| AC-11 | Guardrail | audit DTO separation | `members.ts` / builder review | covered by design review |

## Gap Check

Core unverified AC before Phase 9: 0 planned gaps.
