# Phase 6 Output: Failure Cases

## Covered Failures

| Failure | Detection |
| --- | --- |
| Broken reminder YAML | `actionlint .github/workflows/post-release-observation-reminder.yml` |
| Invalid CI workflow shell snippet | `actionlint .github/workflows/ci.yml` |
| Invalid observation shell syntax | `bash -n scripts/observation/create-reminder-issue.sh` |
| Observation behavior regression | `bash scripts/observation/test/test-create-reminder-issue.sh` |
| Shellcheck warning in target helper | `shellcheck scripts/observation/*.sh` |
| Unexpected secret literal | allowlist grep rejecting non-`GITHUB_TOKEN` secrets |

## Gate

Failure coverage maps to all acceptance criteria. GitHub Actions runtime failure visibility remains PR-time evidence.
