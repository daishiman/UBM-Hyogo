# Phase 11: Manual Test And Screenshot Coverage

Status: `local_evidence_captured / staging_runtime_pending_user_approval`

## テストケース

| TC-ID | Route | State | Expected |
| --- | --- | --- | --- |
| TC-01 | `/admin/meetings` | default | AdminPageHeader, KPI strip, create form, timeline, and drawer shell render through admin primitives. |
| TC-02 | `/admin/meetings` | empty | Empty meeting state renders through AdminEmptyState and keeps create action available. |
| TC-03 | `/admin/meetings` | drawer open | Attendance drawer opens, candidate controls render, and duplicate attendees are disabled. |
| TC-04 | `/admin/meetings/[id]` | default | Detail page renders header, summary, attendance, CSV import, edit, and danger sections through AdminSectionCard boundaries. |
| TC-05 | `/admin/meetings/[id]` | CSV preview | CSV import preview preserves the parse/preview state machine inside the primitive card shell. |

## 画面カバレッジマトリクス

| TC-ID | Screenshot |
| --- | --- |
| TC-01 | `outputs/phase-11/screenshots/list-default.png` |
| TC-02 | `outputs/phase-11/screenshots/list-empty.png` |
| TC-03 | `outputs/phase-11/screenshots/list-drawer-open.png` |
| TC-04 | `outputs/phase-11/screenshots/detail-default.png` |
| TC-05 | `outputs/phase-11/screenshots/detail-csv-preview.png` |

Staging runtime observation remains user-gated and is separated in `outputs/phase-11/manual-evidence-deferred.md`.
