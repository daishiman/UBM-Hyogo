# Skill Feedback Report

## Template Improvement

- Phase 3 cron tables should require top-level, staging, and production counts, not production only.
- Promotion: reflected in `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` as the queue retry / DLQ feedback rule.

## Workflow Improvement

- For queue retry tasks, require a taxonomy gate separating human-review rows from machine-retry rows before cron implementation.
- For scheduled retry tasks, require a default scheduled-path test without injected failure callbacks.
- Promotion: reflected in `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md` as UBM-031.

## Documentation Improvement

- Phase 8 should explicitly prevent DLQ state changes from being committed without matching audit evidence.
- NON_VISUAL implementation guides should explicitly state screenshot evidence is not required when no UI surface changed.
- Promotion: reflected in `.claude/skills/aiworkflow-requirements/changelog/20260505-issue377-retry-tick-dlq-audit.md`, `.claude/skills/task-specification-creator/SKILL-changelog.md`, and `.claude/skills/task-specification-creator/LOGS/20260505-issue377-retry-tick-dlq-audit-feedback.md`.
