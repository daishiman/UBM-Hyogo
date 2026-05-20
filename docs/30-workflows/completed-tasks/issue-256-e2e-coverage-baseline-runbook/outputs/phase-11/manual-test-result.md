# Phase 11 Manual Test Result

## Summary

NON_VISUAL local evidence captured on 2026-05-18.

| Check | Command | Result |
| --- | --- | --- |
| exclude ratio script | `pnpm exec tsx scripts/measure-coverage-exclude-ratio.ts --out docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/outputs/phase-7/coverage-exclude-ratio.json` | completed; JSON evidence written; test spec denominator excluded |
| markdown evidence | `pnpm exec tsx scripts/measure-coverage-exclude-ratio.ts --out docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/outputs/phase-7/coverage-exclude-ratio.md` | completed; markdown evidence written |
| unit regression | `pnpm exec vitest run scripts/__tests__/measure-coverage-exclude-ratio.spec.ts` | PASS: 1 file / 5 tests |
| CLI smoke | `pnpm coverage:measure-exclude-ratio` | PASS: `37 / 80 = 46.3%`, `status=warn` |
| workflow yaml | downloaded `actionlint` and ran `.github/workflows/verify-coverage-exclude-ratio.yml` | PASS: exit 0 |
| repository typecheck | `pnpm typecheck` | PASS |
| repository lint | `pnpm lint` | PASS |

## Boundary

GitHub Actions runtime evidence is verified in CI. Commit, push, PR, and issue mutation remain user-gated.
