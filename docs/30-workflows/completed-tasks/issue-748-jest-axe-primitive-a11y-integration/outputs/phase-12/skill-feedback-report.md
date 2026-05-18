# Skill Feedback Report

## Template Improvements

- Phase 12 single-file output is insufficient for implementation tasks. This workflow uses strict 7 physical files.

## Workflow Improvements

- `axe` rule checks and primitive-specific ARIA contract assertions must be classified separately. Axe is not a replacement for exact component API assertions.

## Documentation Improvements

- Source unassigned tasks should be marked consumed in the same wave when a canonical workflow root is created.

## Promotion Routing

| Item | Route | Evidence |
| --- | --- | --- |
| strict 7 enforcement | no-op; already in task-specification-creator | `outputs/phase-12/*` |
| axe vs contract assertion split | workflow-local lesson | `implementation-guide.md` |
| consumed source task pointer | workflow-local sync | source unassigned task |
