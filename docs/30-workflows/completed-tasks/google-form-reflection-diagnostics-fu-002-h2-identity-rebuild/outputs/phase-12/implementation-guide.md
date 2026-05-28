# Implementation Guide

## Part 1: Concept

The issue is a login identity gap: a Form response can exist while the login lookup table has no row for that email.
The fix restores the missing lookup row from verified data instead of changing the web login flow.
If an old `member_id` bridge exists, it is reused; otherwise the API creates a new auto-link identity and still requires normal status checks.

## Part 2: Changed Files

- `apps/api/migrations/0021_backfill_member_identities.sql`
- `apps/api/src/repository/identities.ts`
- `apps/api/src/routes/auth/session-resolve.ts`
- `apps/api/src/repository/__tests__/identities.autolink.spec.ts`
- `apps/api/src/routes/auth/session-resolve.contract.spec.ts`
- `docs/00-getting-started-manual/specs/02-auth.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-google-form-reflection-diagnostics-fu-002-h2-identity-rebuild-artifact-inventory.md`

## Part 3: Implementation Steps

1. Add bridge-backed migration 0021 for recoverable historical rows.
2. Add repository helpers to find, insert, and retry identity lookup by verified email.
3. Integrate auto-link into `/auth/session-resolve` before returning `unregistered`.
4. Extend D1 and Hono contract tests for bridge-backed success, repeated idempotency, and status-missing fallback.

## Part 4: Verification Commands

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/repository/__tests__/identities.autolink.spec.ts apps/api/src/diagnostics/forms-pipeline.spec.ts apps/api/src/diagnostics/forms-pipeline.contract.spec.ts
pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/routes/auth/session-resolve.contract.spec.ts
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/api lint
```

## Part 5: Known Boundary

Current schema cannot recover an existing `member_status.member_id` from `member_responses` alone because `member_responses` has no `member_id`.
The migration therefore only restores rows with a `tag_assignment_queue` response bridge.
Bridge-less rows are safely recoverable for future login by verified email but cannot be attached to an unknown historical member id without additional source data.
