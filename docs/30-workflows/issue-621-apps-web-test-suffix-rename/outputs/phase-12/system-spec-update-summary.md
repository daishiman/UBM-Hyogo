# System Spec Update Summary

## Current Facts

| Target | Fact |
| --- | --- |
| apps/web Vitest tests | 70 files renamed from `.test.ts(x)` to `.spec.ts(x)` |
| existing Playwright/E2E specs | 17 files already used `.spec.ts`; untouched |
| residual apps/web `.test.ts(x)` | 0 |
| apps/web `.spec.ts(x)` total | 87 |
| ADR | `outputs/phase-12/test-file-suffix-adr-apps-web.md` |

## Same-Wave Sync

| File | Sync |
| --- | --- |
| `apps/web/package.json` | `verify-design-tokens` path updated |
| `.github/workflows/ci.yml` | build label updated |
| `apps/web/src/__tests__/static-invariants.runtime.spec.ts` | self exclusion updated |
| `scripts/lint-boundaries.mjs` | `.spec` test files excluded from production boundary scan |
| `scripts/lint-stablekey-literal.mjs` | `.spec` test files excluded like `.test` files |
| `apps/web/src/lib/api/me-types.spec-d.ts` | type-only test suffix aligned from `.test-d.ts` to `.spec-d.ts` |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Issue #621 registered |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Issue #621 quick reference added |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #621 active workflow entry added |
| `.claude/skills/aiworkflow-requirements/references/*` | old apps/web test path references updated where they point to current implemented files |
| `docs/30-workflows/unassigned-task/task-issue-325-followup-001-apps-web-test-suffix-rename.md` | marked transferred/consumed by the Issue #621 workflow |
| workflow docs | scope corrected from `apps/web/src` 53 files to `apps/web` 70 files |

No `docs/00-getting-started-manual/specs/` update was required because this is a workflow-local test naming ADR and does not change application runtime behavior. The aiworkflow-requirements indexes are updated because the rename affects canonical task inventories and current test paths.
