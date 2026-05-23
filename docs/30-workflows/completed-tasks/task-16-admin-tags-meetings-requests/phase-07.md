# Phase 7: Coverage / Line Budget

> 改訂日: 2026-05-10
> 状態: `completed`

## 1. Coverage command

```bash
mise exec -- pnpm -F @ubm-hyogo/web test:coverage -- \
  apps/web/src/components/admin/__tests__/TagQueuePanel.test.tsx \
  apps/web/src/components/admin/__tests__/MeetingPanel.test.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.test.tsx
```

## 2. Target files

- `apps/web/src/components/admin/TagQueuePanel.tsx`
- `apps/web/src/components/admin/MeetingPanel.tsx`
- `apps/web/src/components/admin/RequestQueuePanel.tsx`
- `apps/web/src/lib/admin/api.ts`
- `apps/web/src/lib/admin/server-fetch.ts`

## 3. Acceptance

既存 repo 閾値を下げない。coverage 実測は runtime/user-gated 実装サイクルで Phase 11 evidence に保存する。
