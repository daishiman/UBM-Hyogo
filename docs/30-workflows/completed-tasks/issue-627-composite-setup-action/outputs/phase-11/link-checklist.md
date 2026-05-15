# Link Checklist

| link / path | status | note |
| --- | --- | --- |
| `docs/30-workflows/issue-627-composite-setup-action/index.md` | present | Root workflow summary. |
| `docs/30-workflows/issue-627-composite-setup-action/artifacts.json` | present | Root metadata ledger. |
| `.github/actions/setup-project/action.yml` | present | Implemented local composite action artifact. |
| `.github/workflows/lighthouse.yml` | edited | Uses `./.github/actions/setup-project`. |
| `.github/workflows/e2e-tests.yml` | edited | Uses `./.github/actions/setup-project` in both jobs. |
| `.github/workflows/ci.yml` | edited | Uses `./.github/actions/setup-project` in `workflow-shell-lint`, `ci`, and `coverage-gate`; actionlint target includes the composite action. |
| `.github/workflows/pr-build-test.yml` | edited | Uses `./.github/actions/setup-project` with `setup-strategy: mise`. |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present | Strict Phase 12 compliance record. |
