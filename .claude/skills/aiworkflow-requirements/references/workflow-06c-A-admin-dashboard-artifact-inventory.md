# Artifact Inventory — 06c-A-admin-dashboard

## canonical root

`docs/30-workflows/06c-A-admin-dashboard/`

## workflow state

| field | value |
| --- | --- |
| workflow_state | `spec_created` |
| outputs_contract | `outputs_contract_only` |
| docs scope | `docs-only` |
| remaining scope | `remaining-only` |

## root artifacts

| artifact | status |
| --- | --- |
| `index.md` | present |
| `artifacts.json` | present |
| `phase-01.md` ... `phase-13.md` | present |

## phase 12 required artifacts

| artifact | status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## scope notes

- 既存の admin dashboard 実装（`apps/api/src/routes/admin/dashboard.ts` 等）と正本仕様の
  contract diff を docs-only で同期する follow-up。
- 単一 `GET /admin/dashboard` endpoint を維持し、KPI / recent actions の split は行わない。
- `dashboard.view` audit action は recent actions / KPI 集計から除外する。
