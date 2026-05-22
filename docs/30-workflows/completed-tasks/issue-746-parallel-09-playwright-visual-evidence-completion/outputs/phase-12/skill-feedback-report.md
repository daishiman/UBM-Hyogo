# Skill Feedback Report

## Template Improvements

- Closed issue recovery specs should not mark Phase 11 or Phase 12 `completed` until physical evidence files exist.
- VISUAL_ON_EXECUTION specs should include a file existence gate for canonical PNG count and size before state promotion.
- Promoted to `.claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md` as "Archived workflow visual evidence path drift gate".

## Workflow Improvements

- Use environment-variable override plus completed-tasks default for evidence directories that may move during archive normalization.
- Parent workflow state, child recovery workflow state, source unassigned status, and aiworkflow inventory must be synchronized in the same wave.
- Promoted to `.claude/skills/aiworkflow-requirements/SKILL.md`, `indexes/quick-reference.md`, `indexes/resource-map.md`, `references/task-workflow-active.md`, and `references/workflow-parallel-09-ux-cross-cutting-artifact-inventory.md`.

## Documentation Improvements

- The `1x` / `2x` labels in this workflow mean default viewport and enlarged viewport capture, not deviceScaleFactor screenshots.
- Phase 12 strict outputs must be materialized even when the recovery is small.
