# Phase 12 Close-out: 06c-A-admin-dashboard

## Scope

This close-out covers the `spec_created / docs-only / remaining-only` workflow root at
`docs/30-workflows/06c-A-admin-dashboard/`. It does not implement application code, deploy, commit, push, or create a PR.

## Decisions

- Current canonical task path is `docs/30-workflows/06c-A-admin-dashboard/`.
- The existing baseline is `GET /admin/dashboard` in apps/api, consumed by apps/web through the `/api/admin/dashboard` proxy.
- The follow-up contract remains a single dashboard endpoint; split `/kpi` and `/recent-actions` endpoints are rejected.
- Dashboard KPI matches the current manual specs: `総会員数 / 公開中人数 / 未タグ人数 / スキーマ未解決件数`.
- Recent actions are `audit_log` rows from the last 7 days, max 20 rows, excluding `dashboard.view`.
- Dashboard viewing is logged as `dashboard.view` and must not inflate dashboard KPI or recent actions.

## Evidence Boundary

- Phase 1-13 root specs exist.
- Phase 12 strict 7 files exist under `outputs/phase-12/`.
- Runtime screenshot, curl, wrangler tail, and real visual evidence are not executed in this docs-only close-out.
- Visual execution is delegated to implementation execution, 08b E2E, and 09a staging smoke.

## 4 Conditions

| Condition | Result | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | The docs now classify 06c-A as a baseline-diff follow-up instead of claiming the dashboard is absent. |
| 漏れなし | PASS | Phase 12 strict 7 files are present, and runtime screenshot/API/UI updates are explicitly deferred. |
| 整合性あり | PASS | Current path, existing API/proxy boundary, and `spec_created` boundary are explicit. |
| 依存関係整合 | PASS | Upstream 06b/admin gate and downstream 08b/09a gates are preserved. |
