# 2026-05-14 Issue #668 RB-3b-03 / RB-3b-04 paths filter + shell helper spec sync

## Summary

Registered `docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/` as an `implemented-local-runtime-pending / implementation / NON_VISUAL` workflow with Phase 11 local evidence and Phase 12 strict 7 outputs.

## Canonical Decisions

- Issue #668 remains CLOSED; PR and issue references must use `Refs #668` only.
- RB-3b-03 uses a single-workflow precheck in `e2e-tests.yml`; docs-only PRs get a no-op `e2e-tests-coverage-gate` success, while relevant code changes run the e2e matrix. The earlier `e2e-tests-skip.yml` complement design was withdrawn to avoid duplicate required contexts on mixed PRs.
- RB-3b-04 introduces `scripts/lib/ci-shell-prelude.sh` and `lint-shell.yml` shellcheck gate while preserving existing `coverage-gate-e2e.sh` fixture / output behavior.
- Branch protection mutation is unnecessary because `e2e-tests-coverage-gate` context name is preserved.

## Updated Surfaces

- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `references/task-workflow-active.md`
- `docs/30-workflows/unassigned-task/task-e2e-stage3b-rb-followup-composite-actions-001.md`

## User Gate

Dry-run PRs, GitHub Actions runtime evidence, GitHub issue comments, commit, push, and PR remain user-gated.
