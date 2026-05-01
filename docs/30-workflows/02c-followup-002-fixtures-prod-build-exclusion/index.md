# 02c-followup-002-fixtures-prod-build-exclusion

## wave / mode / owner

| Item | Value |
| --- | --- |
| wave | 02c-followup |
| mode | serial foundation |
| owner | apps/api build boundary |
| state | spec_created / implementation-spec |
| visualEvidence | NON_VISUAL |

## purpose

Formalize the follow-up that keeps `apps/api` test fixtures out of production builds. The task is intentionally narrow: separate build-only inputs from test-only inputs and add a static import guard so `__fixtures__` and `__tests__` cannot drift into runtime code.

## source

- Legacy unassigned task: `docs/30-workflows/unassigned-task/02c-followup-002-fixtures-prod-build-exclusion.md`
- Upstream discovery: `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-12/unassigned-task-detection.md`
- Canonical requirement: `.claude/skills/aiworkflow-requirements/references/database-admin-repository-boundary.md`

## scope in

- `apps/api` build/test TypeScript boundary.
- `vitest` include/exclude consistency.
- `.dependency-cruiser.cjs` production import guard for `__fixtures__` and `__tests__`.
- NON_VISUAL evidence paths for build, test, and dependency boundary checks.
- Documentation sync for 02c invariant #6.

## scope out

- Implementing production seed data.
- Refactoring 02a / 02b tests beyond preserving their shared fixture setup.
- Deploying to Cloudflare.
- Commit, push, or PR creation without explicit user approval.

## acceptance criteria

| AC | Requirement | Evidence |
| --- | --- | --- |
| AC-1 | `apps/api` production build excludes `__fixtures__/**` and `__tests__/**` | build artifact listing / grep |
| AC-2 | Vitest still loads repository fixtures and shared `_setup.ts` | focused test run |
| AC-3 | production code cannot import from `__fixtures__` or `__tests__` | dependency-cruiser failure fixture or lint output |
| AC-4 | 02a / 02b shared test setup remains compatible | affected test list |
| AC-5 | 02c invariant #6 is updated with the build-time guard | Phase 12 documentation update |

## dependencies

| Type | Target | Reason |
| --- | --- | --- |
| Depends On | 02c data access boundary close-out | created the fixture and test setup risk |
| Depends On | `apps/api` current build scripts | determines whether `tsconfig.build.json` or script wiring is required |
| Blocks | later repository fixture additions | prevents repeated local judgment on fixture safety |
| Blocks | production bundle audit | fixture absence must be mechanically provable |

## phase index

- [phase-01.md](phase-01.md) - Requirements
- [phase-02.md](phase-02.md) - Design
- [phase-03.md](phase-03.md) - Design review
- [phase-04.md](phase-04.md) - Test strategy
- [phase-05.md](phase-05.md) - Implementation runbook
- [phase-06.md](phase-06.md) - Failure cases
- [phase-07.md](phase-07.md) - AC matrix
- [phase-08.md](phase-08.md) - DRY review
- [phase-09.md](phase-09.md) - Quality gate
- [phase-10.md](phase-10.md) - Final review
- [phase-11.md](phase-11.md) - NON_VISUAL evidence
- [phase-12.md](phase-12.md) - Documentation sync
- [phase-13.md](phase-13.md) - Approval gate

## completion definition

This workflow is complete as a specification when all 13 phase files, root `artifacts.json`, and Phase 12 seven required outputs exist and agree on `spec_created / implementation-spec / NON_VISUAL`. Runtime implementation remains blocked until a later execution wave.
