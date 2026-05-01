# Skill Feedback Report

## Required Follow-up

| Target | Feedback | Handling |
| --- | --- | --- |
| `task-specification-creator` | Generated/planned contract-test examples can drift to non-existent paths such as `apps/api/test/contract/...` or `apps/web/src/lib/api/admin.ts`. This repository uses route tests under `apps/api/src/routes/admin/` and the admin web client at `apps/web/src/lib/admin/api.ts`. | Applied to `.claude/skills/task-specification-creator/SKILL.md`, `references/phase-template-core.md`, and `LOGS/_legacy.md` during the Phase 12 sync wave. |

## Applied Lesson

Shared schema SSOT is the preferred fix for API/web body drift when both packages already depend on
`@ubm-hyogo/shared`. For UT-07A-02 this avoided duplicating the discriminated union in API and web.
