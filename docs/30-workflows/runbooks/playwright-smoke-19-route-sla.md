# Playwright Smoke SLA Runbook

## Scope

The historical name is "19-route smoke"; the current executable source of truth is the 17-entry `ROUTES` table in `apps/web/playwright/tests/full-smoke.spec.ts`.

## SLA

| Item | Requirement |
| --- | --- |
| Required check | `playwright-smoke / smoke (chromium)` |
| HTTP status | Each route returns `< 400`, except the canary route that must return `404` |
| Accessibility | serious / critical `axe-core` violations must be `0` |
| Auth coverage | public, member, and admin route groups must all have at least one route |

## Route Inventory

| Group | Routes |
| --- | --- |
| public | `/`, `/members`, `/members/sample-001`, `/register`, `/privacy`, `/terms`, `/login` |
| member | `/profile` |
| admin | `/admin`, `/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit` |
| canary | `/__not_found_canary` |

## Route Addition Procedure

1. Add the route to `ROUTES` with `path`, `auth`, `landmark`, and optional `expectedStatus`.
2. Add or update fixture support in `apps/web/playwright/fixtures/` when a new auth state is needed.
3. Run `mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke`.
4. If the route is intentionally outside smoke coverage, document the reason in the implementing workflow Phase 11 evidence.
