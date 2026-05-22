# Skill Feedback Report — issue-769-root-error-focus

## task-specification-creator

| Area | Feedback | Promotion |
| --- | --- | --- |
| Template improvement | Keep Phase 12 strict 7 as hard requirement even for small NON_VISUAL implementation tasks. This prevented a spec-only close-out. | No template change in this cycle; existing strict 7 rule already covers the behavior. |
| Workflow improvement | Existing-test discovery should be explicit before naming a new test file. The correct target was `apps/web/app/__tests__/error.component.spec.tsx`, not a new `error.spec.tsx`. | Not promoted in this cycle; local workflow and parent spec were corrected, no reusable rule change needed beyond current discovery practice. |
| Documentation improvement | PR templates should avoid asserting PASS before Phase 11 evidence exists. Evidence fields should be either checked after command execution or marked pending. | Not promoted in this cycle; issue-769 PR draft was corrected by evidence boundary wording. |

## aiworkflow-requirements

| Area | Feedback | Promotion |
| --- | --- | --- |
| Template improvement | Current workflow registration must include resource map, quick reference, active guide, artifact inventory, and changelog in the same wave. | Promoted by same-wave updates to `quick-reference.md`, `resource-map.md`, `task-workflow-active.md`, artifact inventory, changelog, LOGS, and generated indexes. |
| Workflow improvement | Parent integration-fixes rows and source unassigned task status should be updated when implementation lands locally, while commit / push / PR remain user-gated. | Promoted in this cycle through parent i06 row and source unassigned task consumed trace. |
| Documentation improvement | Artifact inventory is useful even for tiny implementation tasks because it makes the implementation/spec/test/evidence boundary searchable. | Promoted in `.claude/skills/aiworkflow-requirements/references/workflow-issue-769-root-error-focus-artifact-inventory.md`. |
