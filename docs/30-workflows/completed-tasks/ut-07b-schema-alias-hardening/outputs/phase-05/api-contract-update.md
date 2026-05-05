# API Contract Update

Status: spec_created

`POST /admin/schema/aliases` is the only API contract changed by this task.

Required sync targets:

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

The selected retryable response must include a stable code, retryability flag, processed offset/cursor, total rows when known, and retry timing guidance.
