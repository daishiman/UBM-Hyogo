# 2026-05-17 task-761 visual-full required status check

## Summary

Synchronized `docs/30-workflows/task-761-visual-full-required-status-check/` as `implemented / implementation / NON_VISUAL / governance / external_mutation_completed`.

## Canonical Workflow

- `docs/30-workflows/task-761-visual-full-required-status-check/`

## Canonical Contracts

- Adds the measured `visual-full (desktop|tablet|mobile)` contexts to dev/main required status checks.
- Removes `pull_request.paths` from `.github/workflows/playwright-visual-full.yml` so required checks are emitted for every PR, avoiding GitHub's pending-check behavior for path-filtered workflows.
- Uses required status check contexts endpoints for mutation rather than full branch protection PUT.
- Consumes `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` as the source follow-up.

## Evidence Boundary

This wave creates the workflow root, Phase 12 strict 7 outputs, aiworkflow ledgers, and workflow config guard, then executes branch protection mutation under user approval at 2026-05-17T12:49:39Z. Commit, push, and PR creation remain user-gated.

## Skill Feedback

No skill source rule change is required. Existing task-specification-creator rules for governance mutation gates, Phase 12 strict outputs, state vocabulary, and same-wave aiworkflow sync were applied.
