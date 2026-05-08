# System Spec Update Summary

## Updated

The following aiworkflow-requirements files are synchronized in this cycle:

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | Added latest changelog row for Issue #560 follow-up spec formalization |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added quick lookup entry |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added task-type lookup row |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | Regenerated topic offsets for the new Issue #560 references |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | Regenerated keyword index after adding Issue #560 entries |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added active workflow entry |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-560-next-standalone-instrumentation-patch-artifact-inventory.md` | Added artifact inventory |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-560-next-standalone-instrumentation-patch-2026-05.md` | Added lessons |
| `.claude/skills/aiworkflow-requirements/changelog/20260508-issue560-next-standalone-instrumentation-patch.md` | Added changelog |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Added usage log row |

## Canonical Facts

- Current patch script already exists.
- Current patch target is `.next/standalone/apps/web/.next/server/instrumentation.js`; the obsolete server-functions target path is not used.
- Current package name is `@ubm-hyogo/web`.
- CI target is `.github/workflows/pr-build-test.yml`; `web-cd.yml` remains a Pages deploy workflow and is not edited by this task.

## Step 1-A / 1-H Evidence

| Step | Result |
| --- | --- |
| Step 1-A current canonical set | Issue #560 workflow root, runbook, patch script, regression test, PR build workflow, artifact inventory, lessons, quick-reference, resource-map, topic-map, keywords, LOGS |
| Step 1-H generator / index routing | `topic-map.md` and `keywords.json` are included in the same-wave sync. `node scripts/generate-index.js` is the expected regeneration command for future edits; this cycle records the generated files as dirty diff evidence. |
