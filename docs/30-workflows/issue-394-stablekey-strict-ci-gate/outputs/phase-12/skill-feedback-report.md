# Skill Feedback Report

## task-specification-creator

| Item | Decision | Evidence |
| --- | --- | --- |
| implementation task が現行 blocker によりコード変更不可の場合、Phase 12 は `PASS_WITH_BLOCKER` を許容し、blocking prerequisite と unsafe code change 禁止を明記する | promoted | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` / `SKILL-changelog.md` / `.agents` mirror に反映 |

## aiworkflow-requirements

| Item | Decision | Evidence |
| --- | --- | --- |
| completed-tasks へ移動済み follow-up を indexes に残す場合、旧 `unassigned-task/` path を残さない | promoted | `.claude/skills/aiworkflow-requirements/changelog/20260503-issue-394-stablekey-strict-ci-gate.md` / `SKILL.md` / `.agents` mirror に反映 |
