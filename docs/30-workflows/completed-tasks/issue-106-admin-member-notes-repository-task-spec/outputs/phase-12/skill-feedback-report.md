# Skill Feedback Report

## Routing

| Item | Symptom | Cause | Recurrence condition | 5-minute resolution | Promotion target / no-op reason | Evidence path |
| --- | --- | --- | --- | --- | --- | --- |
| aiworkflow-requirements usage | Product/runtime specs appeared unchanged while workflow evidence changed | Existing specs already covered `adminNotes.ts`, DDL, API boundary, and non-leak rules | Regression-only task with no new API/DB/UI contract | Check `database-admin-repository-boundary.md`, API refs, workflow inventory, and lessons before N/A | Promoted to `aiworkflow-requirements` workflow inventory + lessons; product refs remain no-op because contracts are unchanged | `outputs/phase-12/system-spec-update-summary.md`; `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-106-admin-notes-repository-2026-05.md` |
| Candidate command drift | Stale `pnpm --filter @repo/api test:run -- adminNotes` did not match repo scripts | Old task spec used package name/script that no longer exists | Closed issue / older task spec is executed after workspace command changes | Re-read `package.json`, rerun actual focused command, then sync Phase 1/4/9/11/12 command strings | Promoted to `task-specification-creator/references/phase12-skill-feedback-promotion.md` and `phase-12-documentation-guide.md` | `outputs/phase-12/system-spec-update-summary.md`; `outputs/phase-09/test-output.txt`; `outputs/phase-11/test-output.txt` |
| docsOnly vs user implementation request | Workflow started as docs/spec record but user requested implementation verification | Current facts included real regression test additions | User changes scope after task spec creation | Update root metadata, root/output artifacts, Phase 9/11 evidence, and Phase 13 approval gate in one wave | Promoted to `task-specification-creator/references/phase-12-documentation-guide.md`; no new unassigned task because resolved in-place | `index.md`; `artifacts.json`; `outputs/artifacts.json`; `outputs/phase-13/pr-blocked.md` |

## Promotion

Skill changes were promoted in this close-out:

- `task-specification-creator`: command contract drift rule and Phase 12 compliance check update.
- `aiworkflow-requirements`: workflow inventory, artifact inventory, and issue-106 lessons.
- `skill-creator`: no-op. Existing update-process guidance already covers read-only audit and same-wave skill feedback routing; this task did not change skill authoring workflow.
