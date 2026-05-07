# Phase 12 Task Spec Compliance Check

state: spec_created / formalized contract

This check validates **spec formalization readiness**, not 30 day runtime completion. Runtime AC-1 through AC-8 remain pending until the external 30 day gate passes.

| Check | Result | Evidence |
| --- | --- | --- |
| Strict 7 Phase 12 files present | PASS | `outputs/phase-12/` contains main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / compliance-check |
| Root / outputs artifacts parity | PASS | Both artifacts files remain identical and `workflow_state=spec_created` |
| docs-only / NON_VISUAL state preserved | PASS | No screenshots required; no UI code changed |
| Runtime evidence not falsely claimed | PASS | Phase 11 files list required future evidence and keep `state: spec_created` |
| Parent U-1 formalize trace | PASS | Parent Issue #351 unassigned detection points to Issue #497 workflow |
| Source unassigned task state | PASS | Source task status is `formalized` and includes state transition |
| aiworkflow deployment spec sync | PASS | `deployment-gha.md` contains Issue #497 30 day schedule feedback contract |
| aiworkflow active/index sync | PASS | `task-workflow-active.md`, `quick-reference.md`, `resource-map.md`, `SKILL.md`, and changelog include Issue #497 route |
| Parent automation redaction artifact | PASS | `redaction-check.sh` writes `redaction-check.md`; focused script test covers it |
| Parent automation CI evidence | PASS | `ci.yml` runs `pnpm post-release-dashboard:test` |
| `workflow_state` remains `spec_created` until 30 day gate passes | PASS | Runtime completion is intentionally blocked |
| Changelog target exists | PASS | `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` |

## Runtime Completion Checks

| Runtime Check | Current Result | Required Later |
| --- | --- | --- |
| AC-1: 30 day run coverage | PENDING | Oldest `createdAt` <= execution date - 30 days |
| AC-2: conclusion distribution in `deployment-gha.md` | PENDING | Add measured table after gate |
| AC-3: failure root cause classification | PENDING | Add measured classification after failure log review |
| AC-4: consecutive failure window | PENDING | Add max consecutive failure count |
| AC-5: next action decision | PENDING | `< 10%` no task / `>= 10%` retry-alert task |
| artifact / duration evidence | PENDING | `artifact-downloadability.csv` and duration summary after gate |
| AC-7: raw JSON saved | PENDING | `outputs/phase-11/post-release-dashboard-30d.json` |
| AC-8: redaction grep | PENDING | `outputs/phase-11/redaction-grep.log` |

## 4 Conditions

| Condition | Result | Reason |
| --- | --- | --- |
| 矛盾なし | PASS | Formalization and runtime completion are separated. |
| 漏れなし | PASS for formalization / PENDING for runtime | Required future evidence is enumerated and not claimed. |
| 整合性 | PASS | Issue #497 CLOSED, source formalized, workflow `spec_created`, and docs-only NON_VISUAL are aligned. |
| 依存関係整合 | PASS | Phase 10 30 day gate precedes Phase 11 runtime evidence and Phase 12 measured feedback. |
