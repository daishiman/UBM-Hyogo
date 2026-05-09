# Phase 12 Skill Feedback Report

## Template

Production runtime smoke tasks should require a canonical implementation set before Phase 11:

- single runner path
- single runbook path
- redaction source of truth
- Phase 11 summary-only evidence path
- Phase 13 commit / PR gate separation

This prevents the `run-smoke.sh` / `legacy alternate runner name` / `compatibility wrapper name` naming split from reappearing.

## Workflow

Runtime evidence tasks can be `implemented-local` while the production operation remains `pending_user_gate`. The skill vocabulary should prefer:

`implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

until production evidence is captured. `PASS_RUNTIME_VERIFIED` should be reserved for the approved runtime execution result.

## Documentation

Phase 12 should explicitly check that all named runbook and script paths exist. If a task references `nonexistent runbook reference file`, the verifier should fail unless that file exists or a concrete replacement such as `references/task-workflow-active.md` is specified.

