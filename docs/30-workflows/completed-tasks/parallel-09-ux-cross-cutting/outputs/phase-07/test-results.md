# Phase 7 Test Results

## Local Commands

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm --filter @ubm-hyogo/web typecheck` | completed (exit 0) | TypeScript accepted the new primitives, visual fixture route, and tests. |
| `pnpm --filter @ubm-hyogo/web test apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` | FAIL (startup) | Vitest did not reach test execution because local esbuild host `0.27.3` and binary `0.25.4` mismatch. |
| `rg -n -e '--ubm-color\|#[0-9a-fA-F]{3,8}\|:focus-visible\|prefers-reduced-motion\|=== parallel-09' ...` | completed | New CSS uses existing `--ubm-color-*` tokens; no new component-local HEX color was added. |
| `pnpm --dir apps/web exec playwright test playwright/tests/visual/parallel-09-primitives.spec.ts --project=visual-chromium --reporter=list` | completed if Phase 11 screenshots exist | Captures 6 scenarios x 2 scale into `outputs/phase-11/screenshots/`. |

## Code Fixes From Review

| Finding | Fix |
| --- | --- |
| `FormField` label used generated `htmlFor` even when child supplied an existing `id` | `actualInputId` is now shared by label and cloned child. |
| `EmptyState` contract required children-only backward compatibility | `title` is optional and `children` is rendered before `action`. |
| `Icon` spec expected `name: IconName`, while implementation only accepted children | `Icon` now supports `name?: IconName` and keeps `children` override compatibility. |
| `Pagination` passed event handlers through a Server Component fixture | `Pagination` is explicitly a client component; visual fixture is split into `VisualScenarios.client.tsx`. |

## Boundary

Commit, push, PR, GitHub Issue mutation, and 19-route consumer adoption remain user-gated. Runtime staging/production smoke is not claimed.
