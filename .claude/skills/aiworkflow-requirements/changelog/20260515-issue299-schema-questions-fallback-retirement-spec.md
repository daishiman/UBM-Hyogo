# 2026-05-15 Issue #299 schema_questions fallback retirement spec sync

## Summary

Registered `docs/30-workflows/task-issue-299-schema-questions-fallback-retirement-001/` as the canonical execution workflow for retiring the `schema_questions.stable_key` fallback. After the GO branch, the workflow is `implementation_complete_pending_pr / implementation / NON_VISUAL / fallback_retired_local / COVERAGE_ZERO_VERIFIED_LOCAL`.

## Synced surfaces

- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-task-issue-299-schema-questions-fallback-retirement-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-299-schema-questions-fallback-retirement-2026-05.md`
- `.claude/skills/task-specification-creator/SKILL.md` (Trigger に fallback retirement 系 4 keyword 追加)
- `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md`

## Boundary

Issue #299 remains OPEN. D1 runtime coverage execution and fallback code deletion are complete locally. Commit, push, PR, and Issue mutation remain user-gated. PR wording must use `Refs #299`.
