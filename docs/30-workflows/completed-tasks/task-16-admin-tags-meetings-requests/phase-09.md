# Phase 9: QA Gates

> 改訂日: 2026-05-10
> 状態: `completed`

## 1. Commands

```bash
mise exec -- pnpm -F @ubm-hyogo/web typecheck
mise exec -- pnpm -F @ubm-hyogo/web lint
mise exec -- pnpm -F @ubm-hyogo/web verify-design-tokens
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/components/admin/__tests__/TagQueuePanel.test.tsx \
  src/components/admin/__tests__/MeetingPanel.test.tsx \
  src/components/admin/__tests__/RequestQueuePanel.test.tsx \
  src/components/layout/__tests__/AdminSidebar.test.tsx
```

## 2. Grep gates

```bash
rg -n '#[0-9a-fA-F]{6,8}\b|bg-\[#|text-\[#|border-\[#' \
  'apps/web/app/(admin)/admin/tags' \
  'apps/web/app/(admin)/admin/meetings' \
  'apps/web/app/(admin)/admin/requests' \
  apps/web/src/components/admin

git diff --name-only -- apps/api 'apps/web/app/api/admin/[...path]/route.ts' 'apps/web/app/(admin)/layout.tsx'
```

期待: grep 0 件、禁止 path diff 0 件。
