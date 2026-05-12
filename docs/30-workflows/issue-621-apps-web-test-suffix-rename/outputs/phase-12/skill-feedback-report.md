# Skill Feedback Report

## task-specification-creator

| Finding | Routing |
| --- | --- |
| A workflow marked implementation cannot remain `spec_created` after apps/packages code changes are made. | Already covered by existing Phase 12 implemented-local rule; no skill change required. |
| `apps/web` test suffix tasks must use live `find apps/web`, not stale `apps/web/src` counts. | Skill feedback: Phase 12 close-out checks should include a live root scan parity gate when a workflow renames test files. |
| Boundary lint scripts that exempt `.test` files need `.spec` parity when suffix migrations happen. | Completed in `scripts/lint-boundaries.mjs` and `scripts/lint-stablekey-literal.mjs`. |

## aiworkflow-requirements

| Finding | Routing |
| --- | --- |
| Workflow-local ADR alone was not sufficient because aiworkflow indexes and active workflow inventory still referenced old apps/web test paths. | Same-wave sync completed for `resource-map.md`, `quick-reference.md`, `task-workflow-active.md`, and affected artifact inventories / lessons references. Future Phase 12 should grep aiworkflow requirements for renamed paths before PASS. |
| Type-only tests named `*.test-d.ts` sit outside Vitest runtime but still carry the old suffix. | Renamed `apps/web/src/lib/api/me-types.test-d.ts` to `me-types.spec-d.ts` and updated references. Future suffix migrations should include `*.test-d.ts` in discovery or explicitly classify it. |

## automation-30

The 30-method review found scope ambiguity (`apps/web` vs `apps/web/src`) and stale counts. Both were resolved by expanding the rename scope to 70 live Vitest files.
