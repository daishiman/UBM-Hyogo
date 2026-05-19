# Phase 9 QA Result

## Summary

Local focused QA evidence captured on 2026-05-18 after the review correction cycle.

| Check | Command | Result |
| --- | --- | --- |
| exclude ratio unit test | `pnpm exec vitest run scripts/__tests__/measure-coverage-exclude-ratio.spec.ts` | PASS: 1 file / 5 tests |
| exclude ratio CLI | `pnpm coverage:measure-exclude-ratio` | PASS: JSON output, `37 / 80 = 46.3%`, `status=warn` |
| Phase 7 JSON evidence | `pnpm exec tsx scripts/measure-coverage-exclude-ratio.ts --out docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/outputs/phase-7/coverage-exclude-ratio.json` | PASS: JSON regenerated |
| Phase 7 markdown evidence | `pnpm exec tsx scripts/measure-coverage-exclude-ratio.ts --out docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/outputs/phase-7/coverage-exclude-ratio.md` | PASS: markdown regenerated |
| indexes rebuild | `pnpm indexes:rebuild` | PASS: `topic-map.md` and `keywords.json` regenerated |
| workflow lint | downloaded `actionlint` and ran `.github/workflows/verify-coverage-exclude-ratio.yml` | PASS: exit 0 |
| repository typecheck | `pnpm typecheck` | PASS |
| repository lint | `pnpm lint` | PASS |

## Boundary

GitHub Actions runtime execution and PR comment mutation remain PR/runtime gates. The new workflow is wired into `package.json#observation:lint` so recurring local actionlint coverage includes `.github/workflows/verify-coverage-exclude-ratio.yml`.
