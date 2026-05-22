# Skill Feedback Report

## Template Improvements

- Phase status vocabulary must remain split: root `workflow_state` represents the implementation boundary (`implemented-local-runtime-pending` when code/workflow diff exists), while Phase 11 can explicitly split static evidence captured from runtime evidence pending.
- A path normalization wave must verify internal references before treating a moved task root as canonical.

## Workflow Improvements

- For CI secret readiness tasks, the elegant implementation is a name-only pre-check before any smoke script execution. It avoids changing smoke business logic and prevents skip-like false positives.
- Runtime evidence must stay separated from local YAML/runbook evidence when secrets and workflow execution are user-gated.

## Documentation Improvements

- aiworkflow-requirements sync should name both task-01 and task-02 when a parent workflow entry claims `implemented-local-runtime-pending`.
- Phase 12 strict 7 outputs should be created in the task root, even if Phase 12 source notes already exist in `phase-12.md`.
