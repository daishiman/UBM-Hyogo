# Phase 4 Output: Test Design

## Test Matrix

| ID | Command / Evidence | Expected |
| --- | --- | --- |
| T-1 | Ruby YAML parse for reminder workflow | exit 0 |
| T-2 | `bash -n scripts/observation/create-reminder-issue.sh` | exit 0 |
| T-3 | `bash scripts/observation/test/test-create-reminder-issue.sh` | 13 shell cases pass |
| T-4 | `shellcheck scripts/observation/*.sh` | exit 0 |
| T-5 | `actionlint .github/workflows/post-release-observation-reminder.yml` | exit 0 |
| T-6 | secret allowlist grep | no unexpected output |
| T-7 | `actionlint .github/workflows/ci.yml` | exit 0 |
| T-8 | `gh run list --workflow=ci.yml --limit 1` | runtime visibility or pending boundary |

## Gate

No new source test file is required; existing shell unit tests are reused and CI workflow steps become the regression gate.
