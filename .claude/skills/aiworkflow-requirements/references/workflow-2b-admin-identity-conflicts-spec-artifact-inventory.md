# Workflow Artifact Inventory: 2b admin identity conflicts spec

## Metadata

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/2b-admin-identity-conflicts-spec/` |
| state | `runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| parent workflow | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| source sub-task | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2b-admin-identity-conflicts.md` |
| source unassigned task | `docs/30-workflows/unassigned-task/e2e-stage-2-2b-admin-identity-conflicts-001.md` |
| primary implementation file | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` |

## Canonical Files

| Path | Role |
| --- | --- |
| `docs/30-workflows/2b-admin-identity-conflicts-spec/index.md` | workflow root summary |
| `docs/30-workflows/2b-admin-identity-conflicts-spec/artifacts.json` | root artifact ledger |
| `docs/30-workflows/2b-admin-identity-conflicts-spec/phase-1.md` ... `phase-13.md` | phase specs |
| `docs/30-workflows/2b-admin-identity-conflicts-spec/outputs/phase-11/evidence/` | local runtime evidence |
| `docs/30-workflows/2b-admin-identity-conflicts-spec/outputs/phase-12/` | close-out strict 7 evidence |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | implementation: 6 E2E tests (200-240 lines) |
| `apps/web/src/lib/admin/server-fetch.ts` | implementation: SSR fixture gate (`PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1`) |
| `apps/web/playwright.config.ts` | implementation: `isAdminIdentityConflictsRun` env routing |
| `packages/shared/src/schemas/identity-conflict.ts` | implementation: strict zod canonical (`IdentityConflictRowZ` / `MergeIdentityResponseZ`) |
| `packages/shared/src/schemas/identity-conflict.test.ts` | implementation: focused schema tests (177 PASS) |

## Linked Lessons

- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-2b-admin-identity-conflicts-2026-05.md` — 5 lessons (SSR fixture gate area-naming / strict zod / two-layer mock boundary / auth fixture import / runtime_pending three-state)

## Boundary

No API endpoint, D1 schema, or user-facing UI production code changes are part of this close-out. Local implementation includes the Playwright spec, a non-production `server-fetch.ts` inline fixture gate for Server Component list data, Playwright evidence routing, and strict shared schema tests. Remaining firefox / webkit / staging / CI runtime evidence plus commit / push / PR are user-gated.
