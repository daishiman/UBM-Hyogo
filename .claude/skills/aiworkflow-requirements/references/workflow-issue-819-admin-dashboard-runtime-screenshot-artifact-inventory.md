# Workflow Artifact Inventory: issue-819-admin-dashboard-runtime-screenshot

| Category | Path | Status |
| --- | --- | --- |
| workflow root | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/` | spec_created_runtime_pending |
| artifacts (root) | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/artifacts.json` | present |
| artifacts (outputs mirror) | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/artifacts.json` | present |
| index | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/index.md` | present |
| Phase 1 requirements | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-1-requirements.md` | present |
| Phase 2 design | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-2-design.md` | present |
| Phase 3 design review | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-3-design-review.md` | present |
| Phase 4 test plan | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-4-test-plan.md` | present |
| Phase 5 implementation | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-5-implementation.md` | present |
| Phase 6 test additions | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-6-test-additions.md` | present |
| Phase 7 coverage | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-7-coverage.md` | present |
| Phase 8 refactor | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-8-refactor.md` | present |
| Phase 9 QA | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-9-qa.md` | present |
| Phase 10 final review | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-10-final-review.md` | pre_runtime_review |
| Phase 11 manual test | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-11-manual-test.md` | present |
| Phase 12 documentation | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-12-documentation.md` | present |
| Phase 13 PR | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/phase-13-pr.md` | user_gated_placeholder |
| Phase 11 main | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/main.md` | present |
| Phase 11 screenshot (placeholder) | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/screenshots/admin-dashboard-placeholder.png` | runtime_pending |
| Phase 11 screenshot (chart populated) | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/screenshots/admin-dashboard-chart.png` | runtime_pending |
| Phase 11 Playwright spec | `apps/web/playwright/tests/issue-819-status-distribution.spec.ts` | present |
| Phase 11 mock api extension | `apps/web/src/app/api/admin/dashboard/route.ts` 経由の byStatus 注入導線 | runtime_only |
| Phase 11 screenshot plan | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/screenshot-plan.json` | present |
| Phase 11 manual smoke log | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/manual-smoke-log.md` | present |
| Phase 11 typecheck log | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/typecheck.log` | present |
| Phase 11 lint log | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/lint.log` | present |
| Phase 11 test log | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/test.log` | present |
| Phase 11 build log | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/build.log` | present |
| Phase 11 grep-gate log | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/grep-gate.log` | present |
| Phase 11 verification report | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/verification-report.md` | present |
| source unassigned | `docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md` | open_pending_consumed |
| parent workflow | `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/` | parent_evidence_runtime_pending |
| parent screenshot (placeholder) | `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-placeholder.png` | placeholder_artifact_only |
| parent screenshot (chart) | `docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/admin-dashboard-chart.png` | placeholder_artifact_only |
| source issue | GitHub `#819` (closed; PR 文脈は `Refs #819` のみ) | closed_external |
| system spec | `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | present |

## Phase 12 Strict 7

| File | Status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## User-Gated Boundary

| Action | Reason |
| --- | --- |
| 実 screenshot 取得（authenticated admin context） | 実環境 D1 / セッション必要 |
| 親 workflow PNG 置換（`step-05-dashboard-chart-implementation/outputs/phase-11/screenshots/*.png`） | parent evidence の不変条件影響 |
| source unassigned `consumed (by ..., date)` 更新 | canonical workflow link 必須 |
| commit / push / PR | user explicit approval |
