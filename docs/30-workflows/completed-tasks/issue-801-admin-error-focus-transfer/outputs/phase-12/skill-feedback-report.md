# Skill Feedback Report — issue-801 admin error focus transfer

## task-specification-creator

| Area | Feedback | Promotion target | No-op reason | Evidence path |
| --- | --- | --- | --- | --- |
| Template improvement | UI implementation tasks that touch `apps/web/app/**/error.tsx` should not default to NON_VISUAL merely because the deterministic focus assertion is unit-testable. | no skill file change | Existing `VISUAL_ON_EXECUTION` vocabulary and Phase 12 strict 7 rules already cover the correction. | `artifacts.json`, `outputs/phase-11/screenshot-plan.json` |
| Workflow improvement | Root/output artifacts parity and Phase 12 strict 7 must be created in the same wave as implementation, even for one-file UI hardening. | no skill file change | Existing Phase 12 compliance validator checks this; issue-801 now follows it. | `outputs/artifacts.json`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Documentation improvement | PR templates must separate local PASS commands from runtime screenshot/screen-reader pending evidence. | no skill file change | Current PR template can express this once the workflow supplies the evidence boundary. | `phase-13-pr.md`, `outputs/phase-13/pr-summary.md` |

## aiworkflow-requirements

| Area | Feedback | Promotion target | No-op reason | Evidence path |
| --- | --- | --- | --- | --- |
| Template improvement | Follow-up implementation children should be registered with resource-map, quick-reference, task-workflow-active, artifact inventory, and changelog in the same wave. | same-wave docs, no reusable skill change | This is an execution adherence issue, not a missing aiworkflow template. | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`, `references/task-workflow-active.md` |
| Workflow improvement | Source unassigned tasks must be consumed when a canonical workflow root lands and local implementation evidence is captured. | source task update, no reusable skill change | Existing workflow permits consumed source tasks; issue-801 applied it. | `docs/30-workflows/unassigned-task/issue-769-followup-003-admin-error-focus-transfer.md` |
| Documentation improvement | Visual runtime pending should be explicit for admin error UI tasks so local unit focus assertions are not mistaken for browser screenshot evidence. | workflow artifacts, no reusable skill change | Existing `VISUAL_ON_EXECUTION` state is sufficient when used consistently. | `outputs/phase-11/manual-test-result.md`, `outputs/phase-12/implementation-guide.md` |

## automation-30

| Area | Feedback | Promotion target | No-op reason | Evidence path |
| --- | --- | --- | --- | --- |
| Compact evidence | 30 thought methods were applied as a compact table in the review cycle. | no skill file change | Existing compact evidence allowance covers small implementation tasks. | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
