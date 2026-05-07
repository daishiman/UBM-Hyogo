# Documentation Changelog

| File | Type | Summary |
| --- | --- | --- |
| `scripts/release/release-notes.template.md` | new | Release note placeholder template |
| `scripts/release/generate-release-notes.sh` | new | Pure release note renderer |
| `scripts/release/create-github-release.sh` | new | Dry-run/apply GitHub Release wrapper |
| `scripts/release/__tests__/generate-release-notes.bats` | new | Bats contract tests |
| `scripts/release/__tests__/run-all.sh` | new | Local fallback tests when bats is unavailable |
| `.github/workflows/release-create.yml` | new | Tag push draft release / dispatch dry-run workflow |
| `docs/runbooks/release-create.md` | new | Manual fallback runbook |
| `.claude/skills/aiworkflow-requirements/references/release-runbook.md` | new | Release creation SSOT |
| `docs/30-workflows/unassigned-task/task-09c-github-release-tag-automation-001.md` | edited | Consumed pointer to canonical workflow |
