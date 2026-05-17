# i02-admin-error-type-unify Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Task ID | i02-admin-error-type-unify |
| Workflow | `docs/30-workflows/completed-tasks/i02-admin-error-type-unify/` |
| Source | `docs/30-workflows/completed-tasks/integration-fixes-i02-admin-error-type-unify.md` consumed |
| Status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| Sync date | 2026-05-17 |

## Current Facts

| Layer | Artifact |
| --- | --- |
| Hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` |
| Test | `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` |
| Error classes | `apps/web/src/lib/fetch/errors.ts` |
| Workflow root | `docs/30-workflows/completed-tasks/i02-admin-error-type-unify/` |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/i02-admin-error-type-unify/outputs/phase-12/*.md` |
| Root/output artifacts | `artifacts.json`, `outputs/artifacts.json` |

## Contract

- 401 from admin mutation throws `AuthRequiredError` and passes `/login?redirect=...` from `toLoginRedirect(currentPath)` to the configured redirector.
- 403 / 4xx / 5xx from admin mutation throws `FetchAuthedError(status, bodyText)`.
- Hook public shape is `{ trigger, isLoading, error, reset }`; existing `{ trigger, isLoading, error }` callers remain compatible and `error` remains `Error | null`.
- `redirector` and `currentPath` are optional DI points for testability.
- API endpoint contract, D1 schema, and shared error class constructor signatures are unchanged.
- Commit / push / PR remain user-gated.

## Evidence Boundary

Focused local commands are recorded under `outputs/phase-11/evidence/`. Runtime staging evidence is not required because this is
NON_VISUAL client-hook behavior with no new route or schema surface.
