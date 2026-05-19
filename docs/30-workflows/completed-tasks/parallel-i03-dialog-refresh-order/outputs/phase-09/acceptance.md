# Phase 09 Acceptance

| AC | 状態 | 根拠 |
| --- | --- | --- |
| AC-1 | completed | Visibility dialog order spec |
| AC-2 | completed | Delete dialog order spec |
| AC-3 | completed | RequestActionPanel parent refresh removed |
| AC-4 | completed | dialog `callOrder` assertions |
| AC-5 | completed | parent non-refresh assertion |
| AC-6 | completed | web suite 614 passed / 1 skipped |
| AC-7 | completed | props / API signatures unchanged |
| AC-8 | pending_user_approval | Phase 13 commit / push / PR gate |

## Duplicate Pending Regression Check

`DUPLICATE_PENDING_REQUEST` also calls `router.refresh()` before `onSubmitted(...)`.
This preserves the previous parent-owned refresh behavior after moving refresh ownership
into each dialog.
