# admin-attendance-dashboard-ux artifact inventory

State: `implemented_local_runtime_pending / implementation / VISUAL / runtime_visual_pending_user_gate`

## Summary

`docs/30-workflows/admin-attendance-dashboard-ux/` is the active workflow root for the admin attendance dashboard UI/UX recovery. The same wave implements the local `apps/web` changes, focused tests, and local fixture screenshots, while authenticated staging screenshots, commit, push, and PR remain user-gated.

## Workflow Artifacts

| Artifact | Path |
| --- | --- |
| workflow root | `docs/30-workflows/admin-attendance-dashboard-ux/` |
| root metadata | `docs/30-workflows/admin-attendance-dashboard-ux/artifacts.json` |
| output metadata mirror | `docs/30-workflows/admin-attendance-dashboard-ux/outputs/artifacts.json` |
| Phase 11 local evidence | `docs/30-workflows/admin-attendance-dashboard-ux/outputs/phase-11/manual-test-result.md` |
| Phase 12 strict 7 | `docs/30-workflows/admin-attendance-dashboard-ux/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| split follow-up spec | `docs/30-workflows/admin-attendance-dashboard-ux/unassigned-task-specs/admin-attendance-analytics-calc-correction.md` |

## Implementation Targets

| Area | Files |
| --- | --- |
| CSS | `apps/web/src/styles/globals.css` |
| components | `apps/web/src/features/admin/attendance/components/{AttendanceAbsenteeAlert,AttendanceAnalyticsPage,AttendanceFilterBar,AttendanceTop10Ranking,AttendanceZoneDistributionChart,KpiPanel,MemberAttendanceTable,SessionAttendanceTable}.tsx` |
| labels/helpers | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` |
| focused tests | `apps/web/src/features/admin/attendance/__tests__/{format-attendance,KpiPanel,AttendanceZoneDistributionChart}.spec.*` |

## Evidence Boundary

| Evidence | Status |
| --- | --- |
| focused attendance Vitest | PASS recorded in `outputs/phase-11/manual-test-result.md` |
| apps/api diff | empty / unchanged |
| Phase 12 strict 7 | present |
| local fixture screenshots | present (`outputs/phase-11/screenshots/`) |
| staging pixel screenshots | pending user approval |
| commit / push / PR | pending user approval |

## System Boundary

No new API endpoint, D1 schema, Google Form schema, shared response shape, or fetch URL is introduced. The new `ZONE_HELP` export and `ZONE_LABEL` value updates are UI copy only. Calculation semantics correction is split to `unassigned-task-specs/admin-attendance-analytics-calc-correction.md`.

## Lessons Learned

| # | Lesson | How to apply |
| --- | --- | --- |
| L-AAD-001 | vitest 設定パスの drift: `apps/web/vitest.config.ts` は存在せず、実 SSOT はリポジトリルートの `vitest.config.ts`。phase テンプレの既定コマンドが skill-local config を仮定すると focused run が解決失敗する。 | attendance focused vitest は `pnpm exec vitest run --root=. --config=vitest.config.ts <spec paths>` で実行する。task-local artifacts / phase docs はこの形へ補正済み（owning skill 非変更 = no-op）。 |
| L-AAD-002 | `KpiPanel.spec.tsx` を「新規」と誤分類していたが、当該 spec は既存ファイルで「更新」が正。Phase 2/9/13 docs に new 誤記が伝播していた。 | Phase 12 着手時に `ls __tests__/` で実ファイル存在を再判定し、changed-files 分類を「更新（既存）/ 新規」で確定してから documentation-changelog へ転記する。 |
| L-AAD-003 | この同期 wave は close-out（completed-tasks 移動）ではない。workflow_state は `implemented_local_runtime_pending` で Phase 13（commit/push/PR）は user-gated のため、workflow root は active 位置（`docs/30-workflows/admin-attendance-dashboard-ux/`）に留める。 | spec 反映/skill 同期セッションでは dir を completed-tasks へ移動しない。skill 参照・内部 phase docs・artifacts は active パスを正本とする。completed-tasks 移動は未タスク0判定を伴う close-out セッションで別途行う。 |
