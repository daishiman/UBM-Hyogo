# Phase 10: Final Review

> 改訂日: 2026-05-10
> 状態: `completed`

## 1. DoD review

| ID | Evidence |
| --- | --- |
| D-01 tags | `page.tsx` + `TagQueuePanel.test.tsx` + P-16 screenshot plan |
| D-02 meetings | `page.tsx` + `MeetingPanel.test.tsx` + P-16 screenshot plan |
| D-03 requests | `page.tsx` + `RequestQueuePanel.test.tsx` + `admin-requests.spec.ts` |
| D-04 no API diff | `git diff --name-only -- apps/api` |
| D-05 token gate | `pnpm -F @ubm-hyogo/web verify-design-tokens` |
| D-06 focused tests | Phase 9 focused command |
| D-07 visual evidence | Phase 11 user-gated capture plan |
| D-08 strict outputs | Phase 12 strict 7 files present |

## 2. Blocker criteria

API endpoint/body drift, repo path drift, missing Phase 12 output, or uppercase workflow state is CRITICAL.

## 3. Same-cycle review fix

- `MeetingPanel` no longer renders the MVP-out-of-scope CSV export link.
- `MeetingPanel.test.tsx` now asserts that the CSV link is absent while edit/update behavior remains covered.
