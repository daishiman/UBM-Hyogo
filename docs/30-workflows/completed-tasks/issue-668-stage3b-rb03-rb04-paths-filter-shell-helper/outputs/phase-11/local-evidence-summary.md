# Phase 11 Local Evidence Summary

| Evidence | Command | Result | Raw log |
| --- | --- | --- | --- |
| bash syntax | `bash -n scripts/lib/ci-shell-prelude.sh scripts/coverage-gate-e2e.sh scripts/coverage-guard.sh` | PASS exit 0 | `outputs/phase-11/evidence/local/bash-n.log` |
| focused shellcheck | `shellcheck --severity=warning --external-sources scripts/lib/ci-shell-prelude.sh scripts/coverage-gate-e2e.sh scripts/coverage-guard.sh` | PASS exit 0 | `outputs/phase-11/evidence/local/shellcheck-prelude.log` |
| all tracked shellcheck | `git ls-files -z 'scripts/*.sh' 'scripts/**/*.sh' | xargs -0 shellcheck --severity=warning --external-sources` | PASS exit 0 | `outputs/phase-11/evidence/local/shellcheck-all.log` |
| e2e precheck design | `rg -n "grep -Eq|run_e2e=false|run_e2e=true|e2e skipped by paths precheck" .github/workflows/e2e-tests.yml` + `test ! -f .github/workflows/e2e-tests-skip.yml` | PASS; single workflow precheck present and skip workflow removed | `outputs/phase-11/evidence/local/paths-precheck.log` |
| coverage gate boundary | fixture summaries at 79 / 80 / 81 percent | PASS; 79 fails, 80 and 81 pass | `outputs/phase-11/evidence/local/coverage-gate-dryrun.log` |
| prelude inventory | `rg -n "source.*ci-shell-prelude" scripts/coverage-gate-e2e.sh scripts/coverage-guard.sh` and function grep | PASS | `outputs/phase-11/evidence/inventory/grep-*.txt` |
| workflow YAML parse | `ruby -e 'require "yaml"; ARGV.each { |f| YAML.load_file(f) }' .github/workflows/e2e-tests.yml .github/workflows/lint-shell.yml` | PASS | terminal validation |
| coverage guard focused test | `mise exec -- pnpm vitest run scripts/coverage-guard.spec.ts` | PASS: 1 file, 7 tests | terminal validation |

## Pending User-Gated Evidence

GitHub Actions dry-run PR checks, branch protection governance reads, issue comments, commit, push, and PR creation are pending explicit user approval. `actionlint` is not installed in this local environment; YAML parse and PR runtime evidence are used as the available validation boundary.
