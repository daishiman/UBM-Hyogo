# 2026-05-26 admin-ui-task-d-attendance-primitive-conformance

`admin-ui-task-d-attendance-primitive-conformance` を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として同期。

- `/admin/dashboard/attendance` を `AdminPageHeader` + `KpiCard` + `AdminTable` へ整流する Task D standalone workflow を作成。
- `AdminTable` の client boundary を踏まえ、`AttendanceDashboardSections.client.tsx` を implementation target に追加。
- `AdminPageHeader` は現行 `_layout/AdminPageHeader.tsx` / barrel export を正本とし、`pretitle` や `_shared/AdminPageHeader` 参照を撤回。
- Phase 11 planning evidence、Phase 12 strict 7、root/output artifacts parity、quick-reference / resource-map / task-workflow-active / artifact inventory を同一 wave で反映。
- 2026-05-27 review cycle で Phase 11 runtime pending を解消。Playwright mock API scenario と visual spec を追加し、`attendance-all-ok.png` / `attendance-overview-error.png` / `attendance-by-session-empty.png` を取得。

commit、push、PR、staging visual baseline は user-gated。
