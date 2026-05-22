# Local Static Checks

Date: 2026-05-13

| command | exit | result |
| --- | ---: | --- |
| `git diff --check` | 0 | PASS |
| `rg -n -F 'uses: ./.github/actions/setup-project' .github/workflows/ci.yml .github/workflows/e2e-tests.yml .github/workflows/lighthouse.yml .github/workflows/pr-build-test.yml` | 0 | PASS; 7 call sites found |
| official `download-actionlint.bash` + `actionlint` against `.github/workflows/post-release-observation-reminder.yml`, `ci.yml`, `e2e-tests.yml`, `lighthouse.yml`, `pr-build-test.yml`, `web-cd.yml`, `runtime-smoke-staging.yml` | 0 | PASS |
| `node` structure assertion for `.github/actions/setup-project/action.yml` | 0 | PASS; verified `runs.using: composite` and pinned nested actions |

Note: `.github/actions/setup-project/action.yml` is intentionally not passed to `actionlint`; actionlint validates workflow files and reports missing `on` / `jobs` sections for composite actions.
