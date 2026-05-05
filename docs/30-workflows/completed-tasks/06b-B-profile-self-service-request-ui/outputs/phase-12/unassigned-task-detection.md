# Unassigned Task Detection — 06b-B-profile-self-service-request-ui

## Summary

1 new follow-up is formalized. 1 candidate is intentionally not created because it belongs to an existing admin backlog, not to this UI spec.

## Candidates

| Candidate | Decision | Placement | Reason |
| --- | --- | --- | --- |
| Pending banner sticky 化（reload 後も pending state を復元） | open / formalized | `docs/30-workflows/unassigned-task/task-06b-b-profile-request-pending-banner-sticky-001.md` | MVP UI can show local success state, but durable pending state needs API/read-model support and should not be hidden inside the initial UI task |
| Admin request queue 再設計 | baseline / no new task | existing admin backlog | 管理者側 queue UI and state transition redesign is outside 06b-B; this task only creates member-facing request entry points |

## SF-03 Design Task Pattern Check

| Pattern | Result |
| --- | --- |
| 型定義→実装 | Covered by 06b-B implementation runbook; not a separate follow-up |
| 契約→テスト | Covered by Phase 4 / Phase 11 E2E plan |
| UI仕様→コンポーネント | This entire workflow is the implementation input |
| 仕様書間差異→設計決定 | No unresolved conflict after 04b API / 06b profile / 06b-A session resolver dependency split |

## Open Follow-Up

- `task-06b-b-profile-request-pending-banner-sticky-001.md`

## Zero-Count Rule

Not zero. The sticky pending banner follow-up is intentionally separated to keep 06b-B minimal and avoid over-designing the first UI increment.
