# Skill Feedback Report

## テンプレ改善

| Item | Decision | Promotion target / no-op reason | Evidence path |
| --- | --- | --- | --- |
| Phase 12 strict file rule | No-op | Existing rule already caught missing `main.md`, changelog, unassigned detection, and skill feedback outputs | `.claude/skills/task-specification-creator/references/phase-12-spec.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| New template requirement | No-op | No new template shape is needed; Issue #533 is covered by existing NON_VISUAL implementation and provider-context rules | `outputs/phase-12/system-spec-update-summary.md` |

## ワークフロー改善

| Item | Decision | Promotion target / no-op reason | Evidence path |
| --- | --- | --- | --- |
| Focused test command drift | Promote | Added Issue #533 example to task-specification-creator command drift rule; use `pnpm exec vitest run --root=. --config=vitest.config.ts <exact files>` when package filter does not narrow tests | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md`, `.claude/skills/task-specification-creator/SKILL-changelog.md` |
| `spec_created` to verified code wave | Promote | Added Issue #533 applied example for `verified / implementation_complete_pending_pr` promotion once code, focused tests, Phase 11 evidence, and Phase 12 strict outputs pass | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md`, `.claude/skills/task-specification-creator/SKILL.md` |

## ドキュメント改善

| Item | Decision | Promotion target / no-op reason | Evidence path |
| --- | --- | --- | --- |
| aiworkflow-requirements lookup | Promote | Issue #533 quick-reference, resource-map, task-workflow, and artifact inventory are synchronized | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`, `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`, `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| Issue #371 source stub | Promote | Converted stale nested unassigned stub to consumed pointer and registered path mapping | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/unassigned-task/public-profile-builder-attendance-injection.md`, `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md` |
| Dedicated lessons file | No-op | Existing provider-context and Phase 12 strict-output lessons cover the reusable rule; Issue #533 only adds a concrete applied example | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` |
