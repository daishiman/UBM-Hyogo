# E2E Coverage Fallback Metric Runbook

## Trigger

Use this runbook when `coverage:measure-exclude-ratio` reports `status: warn` for `apps/web/app`.

## Required Signals

| Signal | Source | Passing boundary |
| --- | --- | --- |
| Route smoke pass rate | `playwright-smoke / smoke (chromium)` recent runs | Latest run green; 30-day success rate target >= 95% |
| Route hit coverage | `apps/web/playwright/tests/full-smoke.spec.ts` | All 17 route entries return the expected status |
| Accessibility smoke | `@axe-core/playwright` output in full smoke | serious / critical violations = 0 |
| Staging smoke | `.github/workflows/runtime-smoke-staging.yml` | Latest authorized run green |

## Action Policy

- If the ratio is >= 30% and all required signals are green, keep the PR as a soft warning and record the evidence path in the workflow Phase 11 output.
- If any required signal is red, fix the failing route or assertion in the same cycle before relying on the fallback.
- If the same excluded area warns across three consecutive implementation cycles, split the testable view model or component out of the route file and add focused unit coverage.
