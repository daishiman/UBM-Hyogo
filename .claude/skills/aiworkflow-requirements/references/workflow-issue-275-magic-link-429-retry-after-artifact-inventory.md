# issue-275-magic-link-429-retry-after Artifact Inventory

| Item | Value |
| --- | --- |
| task_id | issue-275-magic-link-429-retry-after |
| status | implemented_local_evidence_captured / implementation / NON_VISUAL |
| canonical task root | `docs/30-workflows/completed-tasks/issue-275-magic-link-429-retry-after/` |
| source issue | #275 OPEN; PR text must use `Refs #275` |
| parent | `docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/` |
| source follow-up | `docs/30-workflows/unassigned-task/UT-06B-MAGIC-LINK-RETRY-AFTER.md` consumed |

## Implementation

| File | Role |
| --- | --- |
| `apps/web/src/lib/auth/magic-link-client.ts` | Adds `MagicLinkRateLimitedError extends MagicLinkRequestError`; parses 429 `Retry-After` header, body `retryAfterSec`, default 60 |
| `apps/web/app/login/_components/MagicLinkForm.client.tsx` | Handles typed rate-limit error with `setCooldown(retryAfterSec)` and preserves input URL state |
| `apps/web/src/lib/auth/magic-link-client.spec.ts` | Covers 429 header/body/default/invalid JSON and subclass contract |
| `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx` | Covers 429 cooldown, no error state transition, and 200 OK regression |

## Evidence

| Evidence | Status |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-275-magic-link-429-retry-after/outputs/phase-11/manual-test-result.md` | present |
| `docs/30-workflows/completed-tasks/issue-275-magic-link-429-retry-after/outputs/phase-12/phase12-task-spec-compliance-check.md` | present |
| `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/auth/magic-link-client.spec.ts` | relevant spec PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web test -- app/login/_components/MagicLinkForm.component.spec.tsx` | relevant spec PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web test -- app/login/_components/MagicLinkForm.component.spec.tsx` | full web suite PASS: 154 files / 1126 tests, 1 skipped |
| `mise exec -- pnpm typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web build` | PASS with existing warnings |

## User-gated

Commit, push, PR creation, deploy verification, real browser/API manual smoke, and Issue mutation are user-gated.
