# Phase 4: Test Strategy

## Test Matrix

| Case | Anchor | AC |
| --- | --- | --- |
| Target member only | `adminNotes.test.ts` | AC-4 |
| Unknown member returns `[]` | `adminNotes.test.ts` | AC-6 |
| Other member note does not leak | `adminNotes.test.ts` | AC-4 |
| `created_at DESC` ordering | `adminNotes.test.ts` | AC-5 |
| Public/member models have no `adminNotes` key | `adminNotes.test.ts`, builder/public tests | AC-2 |
| Mutation route auth/audit | `member-notes.test.ts` | AC-10 handoff |

## Fixture Plan

Use `setupD1()` and `seedAdminNotes`. Add direct D1 seed rows only inside tests to verify ordering and isolation.

## Command Matrix

```bash
pnpm --filter ./apps/api test -- adminNotes
pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/member-notes.test.ts apps/api/src/routes/admin/members.test.ts apps/api/src/repository/__tests__/adminNotes.test.ts
```
