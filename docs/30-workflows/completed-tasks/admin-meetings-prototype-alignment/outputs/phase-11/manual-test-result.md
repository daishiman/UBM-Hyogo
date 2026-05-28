# Manual Test Result

Status: `local_evidence_captured / staging_runtime_pending_user_approval`

| TC-ID | Scenario | Expected | Screenshot |
| --- | --- | --- | --- |
| TC-01 | `/admin/meetings` list default | AdminPageHeader, KPI strip, form, timeline | PASS local screenshot: `screenshots/list-default.png` |
| TC-02 | `/admin/meetings` empty state | AdminEmptyState | PASS local screenshot: `screenshots/list-empty.png` |
| TC-03 | `/admin/meetings` drawer open | attendance drawer and disabled duplicate candidates | PASS local screenshot: `screenshots/list-drawer-open.png` |
| TC-04 | `/admin/meetings/[id]` detail | AdminPageHeader + AdminSectionCard sections | PASS local screenshot: `screenshots/detail-default.png` |
| TC-05 | CSV import preview | existing state machine retained in card shell | PASS local screenshot: `screenshots/detail-csv-preview.png` |

Staging runtime execution remains user-gated and is tracked in `manual-evidence-deferred.md`.
