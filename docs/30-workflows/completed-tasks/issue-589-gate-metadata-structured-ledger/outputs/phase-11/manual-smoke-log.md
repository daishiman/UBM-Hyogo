# Phase 11 Manual Smoke Log

## NON_VISUAL Checks

| Check | Result |
| --- | --- |
| `artifacts.json` exists | PASS |
| `outputs/artifacts.json` exists | PASS |
| root/output artifacts are byte-identical | PASS |
| `outputs/phase-12/main.md` exists | PASS |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` exists | PASS |
| `.claude/skills/aiworkflow-requirements/references/gate-metadata.md` exists | PASS |
| `packages/shared/src/gate-metadata/schema.ts` exists | PASS |
| `scripts/gate-metadata/validate.ts` exists | PASS |
| `.github/workflows/verify-gate-metadata.yml` exists | PASS |
| `pnpm --filter @ubm-hyogo/shared test -- gate-metadata` | PASS: 16 files / 188 tests |
| `pnpm exec vitest run scripts/gate-metadata/__tests__/walk.test.ts` | PASS: 1 file / 12 tests |
| `pnpm --filter @ubm-hyogo/shared typecheck` | PASS |
| `pnpm gate-metadata:validate --require-gates-for-changed ...` | PASS: OK 8 / WARN 322 / ERROR 0 |
| `bash scripts/coverage-guard.sh --package shared` | PASS: lines 95.73 / branches 86.4 / functions 95.83 / statements 95.73 |
| `GOBIN="$PWD/.tmp/bin" go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 && .tmp/bin/actionlint .github/workflows/verify-gate-metadata.yml` | PASS |

## Notes

No browser, screenshot, staging, production, or GitHub mutation smoke is required for this implemented-local NON_VISUAL package. Required status check mutation remains user-gated.
