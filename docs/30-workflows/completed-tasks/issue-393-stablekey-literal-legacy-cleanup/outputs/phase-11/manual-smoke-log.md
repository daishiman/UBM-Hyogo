# Phase 11 Manual Smoke Log

## Execution State

`PASS`: the 14-file replacement has been applied and NON_VISUAL checks were captured in `outputs/phase-11/evidence/`.

Executed commands:

- `node scripts/lint-stablekey-literal.mjs --strict --json`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test apps/api/src/jobs/sync-sheets-to-d1.test.ts apps/api/src/jobs/mappers/sheets-to-members.test.ts apps/api/src/routes/admin/members.test.ts apps/api/src/routes/admin/requests.test.ts apps/api/src/view-models/public/__tests__/public-member-list-view.test.ts apps/api/src/view-models/public/__tests__/public-member-profile-view.test.ts packages/shared/src/utils/consent.test.ts`

Result summary:

- strict stableKey lint: PASS, violations 0, stableKeys 31
- typecheck: PASS across 5 workspace projects
- lint: PASS, including dependency-cruiser and stableKey warning-mode lint
- focused vitest: PASS, 7 files / 57 tests
- local engine note: pnpm emitted a warning because local Node is v22.21.1 while the repo requires Node 24.x; all commands completed successfully.

## Planned Checks

| Check | Command | Expected result |
| --- | --- | --- |
| stableKey strict lint before | `mise exec -- node scripts/lint-stablekey-literal.mjs --strict` | baseline violation count recorded |
| stableKey strict lint after | `mise exec -- node scripts/lint-stablekey-literal.mjs --strict` | exit 0 / 0 violations / stableKeyCount=31 |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| focused tests | `mise exec -- pnpm vitest run --changed` or Phase 4 test matrix paths | exit 0 |

## PASS Rule

This file must not be marked PASS until the implementation wave writes fresh command output under `outputs/phase-11/evidence/`.
