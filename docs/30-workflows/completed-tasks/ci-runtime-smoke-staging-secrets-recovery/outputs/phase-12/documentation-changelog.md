# Documentation Changelog

| Date | Path | Change |
| --- | --- | --- |
| 2026-05-15 | `.github/workflows/runtime-smoke-staging.yml` | Corrected stale runbook path in missing-secret error message |
| 2026-05-15 | `.github/workflows/verify-workflow-doc-refs.yml` | Added workflow doc-reference verification CI |
| 2026-05-15 | `scripts/ci/verify-workflow-doc-refs.sh` | Added repository-local workflow markdown reference existence guard |
| 2026-05-15 | `scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh` | Added shell tests for guard behavior |
| 2026-05-15 | `.github/workflows/{ci,incident-runbook-slack-delivery,pr-build-test,pr-target-safety-gate,verify-indexes,verify-test-suffix}.yml` | Brought workflow docs references into guardable state |
| 2026-05-15 | `.claude/skills/aiworkflow-requirements/**` | Synced runtime smoke staging secret recovery path and state |
| 2026-05-15 | `docs/30-workflows/completed-tasks/ci-runtime-smoke-staging-secrets-recovery/**` | Reclassified as local implementation complete with runtime pending user gate and added Phase 12 strict 7 outputs |
| 2026-05-15 | `docs/30-workflows/completed-tasks/ci-runtime-smoke-staging-secrets-recovery/**` | path drift correction: 旧 `docs/30-workflows/ci-runtime-smoke-staging-secrets-recovery/` root → `completed-tasks/` root へ同期（phase-1.md / phase-13.md / outputs/phase-12 配下 / outputs/phase-13/pr-pending.md / outputs/phase-11/evidence/phase12-compliance.txt） |

## Verification Log

| Command | Exit | Evidence |
| --- | ---: | --- |
| `bash scripts/ci/verify-workflow-doc-refs.sh` | 0 | `../phase-11/evidence/verify-workflow-doc-refs.txt` |
| `bash scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh` | 0 | `../phase-11/evidence/verify-workflow-doc-refs-test.txt` |
| `bash -n scripts/ci/verify-workflow-doc-refs.sh scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh` | 0 | `../phase-11/evidence/bash-syntax.txt` |
| `actionlint` focused workflow set | 0 | `../phase-11/evidence/actionlint.txt` |
| `pnpm verify:phase12-compliance` | 0 | `../phase-11/evidence/phase12-compliance.txt` |
