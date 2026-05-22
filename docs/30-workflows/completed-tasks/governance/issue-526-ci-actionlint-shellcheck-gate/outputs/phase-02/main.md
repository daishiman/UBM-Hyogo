# Phase 2 Output: Basic Design

## Decision

Implement the gate in `.github/workflows/ci.yml` as `workflow-shell-lint`. The reminder workflow remains runtime-only and receives no PR trigger or `needs: lint` coupling.

## Target Design

| Target | Design |
| --- | --- |
| CI job | `workflow-shell-lint` on existing `ci.yml` push / pull_request triggers |
| Permissions | `contents: read` only |
| Shell checks | `bash -n`, `scripts/observation/test/test-create-reminder-issue.sh`, `shellcheck scripts/observation/*.sh` |
| Workflow checks | downloaded `actionlint` for `.github/workflows/post-release-observation-reminder.yml` |
| Secret check | allow `secrets.GITHUB_TOKEN`; reject other `secrets.*` literals |

## Gate

Design is ready for test planning. No shell function signatures are changed.
