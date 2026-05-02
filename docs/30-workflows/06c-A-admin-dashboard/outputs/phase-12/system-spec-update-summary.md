# System Spec Update Summary

## Updated In This Wave

- `docs/30-workflows/06c-A-admin-dashboard/` now declares the current canonical path.
- `artifacts.json` records `workflow_state=spec_created` and `outputs_contract_only=true`.
- Phase 12 strict 7 files were materialized under `outputs/phase-12/`.
- KPI contract was realigned to manual specs: `総会員数 / 公開中 / 未タグ / スキーマ未解決`.
- Existing baseline was clarified: apps/api exposes `GET /admin/dashboard`, while apps/web consumes it through the `/api/admin/dashboard` proxy.
- The follow-up was reclassified from "missing dashboard" to "existing 04c/06c dashboard contract diff".

## aiworkflow-requirements Sync

Same-wave index sync records `06c-A-admin-dashboard` as a follow-up workflow for remaining admin dashboard KPI/API/shared/UI contract alignment. It does not reopen the completed 06c parent task.

## Step 2 Stale Withdrawal

Stale split endpoint candidates `/api/admin/dashboard/kpi` and `/api/admin/dashboard/recent-actions` are withdrawn from the executable contract. They remain only as rejected alternatives in Phase 3.
