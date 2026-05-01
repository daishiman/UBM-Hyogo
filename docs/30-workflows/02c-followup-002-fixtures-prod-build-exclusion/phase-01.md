# Phase 1: Requirements

## Metadata

| Item | Value |
| --- | --- |
| task | 02c-followup-002-fixtures-prod-build-exclusion |
| phase | 1 / 13 |
| state | spec_created |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |
| canonical root | docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/ |

## Goal

Define the minimum implementation work required to prove that `apps/api` dev-only fixtures and tests cannot enter production build artifacts.

## Current facts

- 02c created repository fixtures and shared test setup under `apps/api/src/repository/__fixtures__/` and `apps/api/src/repository/__tests__/`.
- 02c Phase 12 recorded prod build exclusion as a follow-up, not completed runtime evidence.
- The legacy unassigned task existed as a single Markdown file and lacked Phase 1-13 workflow artifacts.
- This wave formalizes the task only. It does not edit application build config or run deployment.

## Acceptance criteria

| AC | Requirement | Evidence |
| --- | --- | --- |
| AC-1 | production build artifacts contain zero `__fixtures__` / `__tests__` paths | `outputs/phase-11/build-artifact-grep.log` |
| AC-2 | repository tests still load fixtures through Vitest | `outputs/phase-11/vitest-focused.log` |
| AC-3 | production source imports from test-only folders fail static boundary checks | `outputs/phase-11/dependency-boundary.log` |
| AC-4 | 02a / 02b shared setup remains compatible | `outputs/phase-11/regression-scope.log` |
| AC-5 | 02c invariant #6 is synchronized to documentation | `outputs/phase-12/system-spec-update-summary.md` |

## Scope

Scope in: build/test config split or equivalent exclude, Vitest consistency, dependency boundary guard, NON_VISUAL evidence, and 02c documentation sync.

Scope out: production seed implementation, unrelated monorepo tsconfig redesign, Cloudflare deploy, commit, push, and PR creation.

## Completion

- Requirements, dependencies, and evidence names are explicit.
- Runtime implementation remains pending and is not represented as PASS in this spec-created wave.
