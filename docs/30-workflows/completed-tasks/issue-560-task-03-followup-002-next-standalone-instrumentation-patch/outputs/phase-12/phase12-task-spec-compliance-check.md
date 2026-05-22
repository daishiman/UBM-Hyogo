# Phase 12 Task Spec Compliance Check

## Checks

| Gate | Result | Evidence |
| --- | --- | --- |
| Phase 1-13 files present | PASS | `phase-01.md` ... `phase-13.md` |
| root / outputs artifacts parity | PASS | `artifacts.json` and `outputs/artifacts.json`; `workflowState=implemented-local`, Phase 1-12 completed, Phase 13 user-gated |
| Phase 12 strict 7 files | PASS | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| placeholder workflow token | PASS | Generic workflow filename placeholders removed |
| command package name | PASS | `@ubm-hyogo/web` |
| target artifact path | PASS | `.next/standalone/apps/web/.next/server/instrumentation.js` |
| NON_VISUAL boundary | PASS | screenshot evidence not required; CLI script + CI gate only |
| source follow-up consumed marker | PASS | `completed-tasks/task-03-followup-002-next-standalone-instrumentation-patch-001.md` marked formalized / consumed |
| commit / PR gate | PASS | Phase 13 remains `blocked_pending_user_approval` |

## 4 Conditions

| Condition | Result | Note |
| --- | --- | --- |
| 矛盾なし | PASS | Script target path, CI workflow, and package name are aligned |
| 漏れなし | PASS | Phase 12 strict files and aiworkflow sync targets are materialized |
| 整合性あり | PASS | `implemented-local / implementation / NON_VISUAL` vocabulary is consistent with local code/test/runbook diffs |
| 依存関係整合 | PASS | Parent task-03 is current upstream; Issue #560 follow-up is formalized |
