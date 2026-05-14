# ADR: Test File Suffix Policy for `apps/web`

| Item | Value |
| --- | --- |
| Status | Accepted for Issue #621 local implementation |
| Date | 2026-05-10 |
| Scope | `apps/web` Vitest tests |
| Issue | #621 |

## Context

Issue #325 established suffix-classified test names for `apps/api`. Issue #621 applies the same idea to `apps/web`, but the web package needs UI-specific classes instead of backend classes such as repository/authz.

## Decision

New and renamed `apps/web` Vitest tests use:

| Class | Suffix | Count in this migration |
| --- | --- | ---: |
| component | `*.component.spec.tsx` | 36 |
| route | `*.route.spec.ts` | 4 |
| page | `*.page.spec.ts(x)` | 1 |
| runtime | `*.runtime.spec.ts` | 5 |
| lib-unit | `*.spec.ts` | 24 |

Playwright/E2E files already using `*.spec.ts` are outside this rename.

## Consequences

- `apps/web/**/*.test.ts(x)` residual count is 0.
- Future `*.spec`-only Vitest convergence can proceed without leaving `apps/web/app` tests behind.
- Direct references must use the new file names.

## Alternatives Considered

| Alternative | Decision |
| --- | --- |
| Rename only `apps/web/src` 53 files | Rejected because `vitest.config.ts` also discovers `apps/web/app` tests |
| Reuse apps/api classes | Rejected because `repository` / backend `authz` are not the primary web taxonomy |
| Keep `.test.ts(x)` | Rejected because it preserves the drift Issue #621 exists to remove |
