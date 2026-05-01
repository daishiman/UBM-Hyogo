# Phase 3: Design Review

## Gate Decision

Decision: GO.

Reason: Phase 1 and 2 found an existing canonical repository. The safest implementation path is to preserve `adminNotes.ts` and add missing regression coverage for the read repository contract.

## Alternative Review

| Alternative | Decision | Reason |
| --- | --- | --- |
| Create `adminMemberNotes.ts` | rejected | Would duplicate canonical `adminNotes.ts` |
| Fetch admin notes inside builder | rejected | Violates invariant #12 and builder dependency direction |
| Mix `admin_member_notes` into builder `audit` from route | rejected for this task | `audit_log` and admin notes have separate meanings |
| Add focused repository tests | accepted | Closes AC-4, AC-5, AC-6 evidence without changing public behavior |

## Phase 4 Start Conditions

- Existing implementation confirmed.
- Test matrix can target `apps/api/src/repository/__tests__/adminNotes.test.ts`.
- Commit, push, and PR remain blocked without user instruction.
