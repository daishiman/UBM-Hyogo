# Workflow Artifact Inventory: issue-255-coverage-threshold-sync-lint

| Field | Value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-255-coverage-threshold-sync-lint/` |
| state | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | `Refs #255` (CLOSED maintained) |
| source task | `docs/30-workflows/completed-tasks/task-codecov-threshold-sync-lint-001.md` (`consumed_by_issue_255`) |
| implementation | `scripts/coverage-threshold-lint.ts` |
| focused test | `scripts/__tests__/coverage-threshold-lint.spec.ts` |
| CI workflow | `.github/workflows/coverage-threshold-lint.yml` |
| root script | `package.json#scripts.lint:coverage-threshold` |
| local evidence | `outputs/phase-11/evidence/lint-coverage-threshold.log`, `outputs/phase-11/evidence/vitest-coverage-threshold-lint.log` |
| user-gated | commit, push, PR, GitHub Actions runtime observation |

## Contract

The lint treats `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` as the SSOT and `scripts/coverage-guard.sh` as the executor source. `codecov.yml` is optional: absence keeps 2-source mode, presence enables 3-source mode without another implementation change.

Exit code contract:

| Exit | Meaning |
| --- | --- |
| 0 | all available sources match |
| 1 | threshold drift detected |
| 2 | required source or optional source parse failure |

## Verification

| Command | Result |
| --- | --- |
| `pnpm lint:coverage-threshold` | PASS, `sources=2`, `threshold=80` |
| `pnpm exec vitest run scripts/__tests__/coverage-threshold-lint.spec.ts` | PASS, 8 tests |
