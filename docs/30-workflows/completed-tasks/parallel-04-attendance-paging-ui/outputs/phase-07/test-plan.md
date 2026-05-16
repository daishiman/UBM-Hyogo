# Phase 7 Test Plan

Focused test file:

- `apps/web/app/profile/_components/AttendanceList.spec.tsx`

Command:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- AttendanceList
```

Required cases:

- default 50 initial records
- button visible when `hasMore=true`
- opaque cursor URL encoding
- append on success
- button hidden when no next page remains
- disabled/loading text while fetch is pending
- `role="alert"` on failure
- empty state

