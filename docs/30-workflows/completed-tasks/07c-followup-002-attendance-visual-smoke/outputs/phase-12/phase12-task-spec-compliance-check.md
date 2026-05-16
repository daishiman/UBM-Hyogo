# Phase 12: phase12-task-spec-compliance-check

[実装区分: 実装仕様書]

## Summary verdict

| Item | Verdict | Evidence |
| --- | --- | --- |
| Overall | `local_visual_evidence_pass` | 07c follow-up 002 は Phase 1-12、apps/web 実装、focused Playwright visual evidence を同一 wave で完了。Phase 13 は commit / push / PR user gate のみ blocked。 |
| taskType | `implementation` | `artifacts.json.metadata.taskType` |
| visualEvidence | `VISUAL_ON_EXECUTION` | `artifacts.json.metadata.visualEvidence` / Phase 11 local mock-screenshot contract |
| workflow_state | `implemented_local_evidence_captured` | root と outputs の `artifacts.json` が同値 |
| evidence_state | `local_visual_evidence_pass` | Phase 11 screenshots / trace / e2e-run evidence captured |
| phase 13 | `blocked_pending_user_approval` | commit / push / PR / Issue mutation は user-gated |

## Changed-files classification

| Path | Classification | Status |
| --- | --- | --- |
| `docs/30-workflows/07c-followup-002-attendance-visual-smoke/index.md` | workflow root spec | `local_visual_evidence_pass` |
| `docs/30-workflows/07c-followup-002-attendance-visual-smoke/artifacts.json` | root metadata ledger | `local_visual_evidence_pass` |
| `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/artifacts.json` | output mirror ledger | `local_visual_evidence_pass` |
| `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-{1..13}/**` | phase specifications | `local_visual_evidence_pass` |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | same-wave index sync | `local_visual_evidence_pass` |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | same-wave resource sync | `local_visual_evidence_pass` |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow ledger | `local_visual_evidence_pass` |
| `.claude/skills/aiworkflow-requirements/references/workflow-07c-followup-002-attendance-visual-smoke-artifact-inventory.md` | artifact inventory | `local_visual_evidence_pass` |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | skill changelog | `local_visual_evidence_pass` |
| `apps/web/playwright/tests/attendance.spec.ts` | focused visual smoke spec | `completed` |
| `apps/web/playwright/fixtures/auth.ts` | standalone mock API | `completed` |
| `apps/web/playwright/fixtures/admin-meetings.ts` | attendance seed builder | `completed` |
| `apps/web/playwright/page-objects/AdminMeetingsPage.ts` | page object selectors/actions | `completed` |
| `apps/web/src/components/admin/MeetingPanel.tsx` | list-page selector exposure | `completed` |
| `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` | detail-page attendance endpoint/body alignment | `completed` |
| `apps/web/playwright.config.ts` | evidence directory and smoke readiness alignment | `completed` |
| `apps/api/src/routes/admin/meetings.ts` | admin meeting detail read route and attendance alias contract alignment | `completed` |
| `apps/api/src/routes/admin/meetings.contract.spec.ts` | admin meeting detail route contract tests | `completed` |
| `.github/workflows/playwright-smoke.yml` | focused attendance visual smoke CI step | `completed_user_gated_runtime` |

## `workflow_state` and phase status consistency

| Check | Verdict | Evidence |
| --- | --- | --- |
| root/output parity | `local_visual_evidence_pass` | `artifacts.json` and `outputs/artifacts.json` are both present and are expected to match byte-for-byte. |
| workflow root | `implemented_local_evidence_captured` | Implementation contract and apps/web diffs are present in the same wave. |
| Phase 1-10 | `completed` | Requirements, design, implementation plan, quality gates, and refactor gates were applied to the implemented files. |
| Phase 11 | `completed` | Visual screenshots, trace, e2e run text, skip count, runner version, and design-token evidence are captured. |
| Phase 12 | `local_visual_evidence_pass` | Strict 7 files exist and same-wave aiworkflow sync is listed below. |
| Phase 13 | `blocked_pending_user_approval` | PR text is a draft only; `Refs #313` is required because Issue #313 is treated as closed/current external state. |
| PASS wording | `local_visual_evidence_pass` | This file avoids bare `PASS`; verdicts include `local_visual_evidence_pass`, `completed`, or user-gated boundary wording. |

## Phase 11 evidence file inventory

| Expected artifact | Current status | Boundary |
| --- | --- | --- |
| `outputs/phase-11/phase-11.md` | `local_visual_evidence_pass` | Evidence protocol only |
| `outputs/phase-11/screenshots/attendance-deleted-excluded.png` | `completed` | Captured by focused Playwright |
| `outputs/phase-11/screenshots/attendance-already-registered.png` | `completed` | Captured by focused Playwright |
| `outputs/phase-11/screenshots/attendance-dup-1.png` | `completed` | Captured by focused Playwright |
| `outputs/phase-11/screenshots/attendance-dup-2.png` | `completed` | Captured by focused Playwright |
| `outputs/phase-11/screenshots/attendance-delete-before.png` | `completed` | Captured by focused Playwright |
| `outputs/phase-11/screenshots/attendance-delete-after.png` | `completed` | Captured by focused Playwright |
| `outputs/phase-11/trace/attendance-delete-trace.zip` | `completed` | Captured by focused Playwright |
| `outputs/phase-11/e2e-run.txt` | `completed` | Must include command and exit code |
| `outputs/phase-11/e2e-list.txt` | `completed` | Must prove attendance spec inclusion |
| `outputs/phase-11/e2e-skip-count.txt` | `completed` | Must contain `0` after implementation |
| `outputs/phase-11/runner-version.txt` | `completed` | Must record Playwright version |
| `outputs/phase-11/verify-design-tokens.txt` | `completed` | Required if selector/UI edits touch `apps/web` |
| `outputs/phase-11/phase11-capture-metadata.json` | `completed` | Must set `provenance: local-mock` |

## Phase 12 strict 7 file inventory

| Required file | Status |
| --- | --- |
| `outputs/phase-12/main.md` | `local_visual_evidence_pass` |
| `outputs/phase-12/implementation-guide.md` | `local_visual_evidence_pass` |
| `outputs/phase-12/system-spec-update-summary.md` | `local_visual_evidence_pass` |
| `outputs/phase-12/documentation-changelog.md` | `local_visual_evidence_pass` |
| `outputs/phase-12/unassigned-task-detection.md` | `local_visual_evidence_pass` |
| `outputs/phase-12/skill-feedback-report.md` | `local_visual_evidence_pass` |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | `local_visual_evidence_pass` |

## Skill/reference/system spec same-wave sync

| Target | Status | Evidence |
| --- | --- | --- |
| `task-specification-creator` | `local_visual_evidence_pass` no-op | Existing rules already required root/output artifacts parity, 9-heading compliance, and runtime boundary vocabulary. No skill file mutation needed. |
| `aiworkflow-requirements/indexes/quick-reference.md` | `local_visual_evidence_pass` | 07c follow-up 002 quick lookup added. |
| `aiworkflow-requirements/indexes/resource-map.md` | `local_visual_evidence_pass` | Progressive Disclosure row added. |
| `aiworkflow-requirements/references/task-workflow-active.md` | `local_visual_evidence_pass` | Active workflow ledger row added. |
| `aiworkflow-requirements/references/workflow-07c-followup-002-attendance-visual-smoke-artifact-inventory.md` | `local_visual_evidence_pass` | Workflow artifact inventory added. |
| `aiworkflow-requirements/SKILL-changelog.md` | `local_visual_evidence_pass` | Same-wave sync entry added. |

## Runtime or user-gated boundary

| Boundary | Status | Rule |
| --- | --- | --- |
| apps/web implementation | `completed` | `attendance.spec.ts`, page object, mock fixture, fixture builder, `MeetingPanel.tsx`, `MeetingAttendancePanel.tsx`, and Playwright config are completed local diffs. |
| screenshots / trace | `completed` | Screenshots and trace are tracked under `outputs/phase-11/`. |
| CI smoke | user-gated | Local focused `desktop-chromium` evidence is captured; workflow is wired to run the focused attendance visual smoke after existing route smoke. Actual GitHub Actions result requires commit / push / PR approval. |
| baseline updates | user-gated | `--update-snapshots` remains forbidden without user approval. |
| commit / push / PR | user-gated | Phase 13 is draft-only; no command is executed in this wave. |
| Issue reference | user-gated | Use `Refs #313`; do not use `Closes`, `Fixes`, or `Resolves` for a closed/source issue from this spec wave. |

## Archive/delete stale-reference gate

| Check | Status | Evidence |
| --- | --- | --- |
| workflow root deletion | `local_visual_evidence_pass` no-op | No root is deleted or moved. |
| stale legacy path | `local_visual_evidence_pass` no-op | New canonical root is `docs/30-workflows/07c-followup-002-attendance-visual-smoke/`. |
| live inventory references | `local_visual_evidence_pass` | aiworkflow quick-reference/resource-map/task-workflow-active/artifact-inventory now point to the same root. |
| historical references | `local_visual_evidence_pass` | Existing 07c follow-up 003 and UT-02A entries remain historical/current references and are not rewritten. |

## Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | `local_visual_evidence_pass` | The workflow uses `workflow_state=implemented_local_evidence_captured` and `evidence_state=local_visual_evidence_pass` without treating Phase 13 as completed. |
| 漏れなし | `local_visual_evidence_pass` | Phase 12 strict 7, root/output artifacts, implementation target list, and aiworkflow sync targets are present. |
| 整合性あり | `local_visual_evidence_pass` | `workflow_state=implemented_local_evidence_captured`, `evidence_state=local_visual_evidence_pass`, `visualEvidence=VISUAL_ON_EXECUTION`, and `completed` evidence boundary are used consistently. |
| 依存関係整合 | `local_visual_evidence_pass` | Upstream 06c/07c/08b/task-18 dependencies are preserved; GitHub Actions CI, baseline update, commit, push, and PR remain user-gated. |
