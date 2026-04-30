# Admin Implementation Runbook

## 作成順

1. `apps/web/src/lib/admin/api.ts`
2. `apps/web/src/lib/admin/server-fetch.ts`
3. `apps/web/app/api/admin/[...path]/route.ts`
4. `apps/web/app/(admin)/layout.tsx`
5. `apps/web/src/components/layout/AdminSidebar.tsx`
6. `apps/web/app/(admin)/admin/page.tsx`
7. `apps/web/app/(admin)/admin/members/page.tsx`
8. `apps/web/src/components/admin/MembersClient.tsx`
9. `apps/web/src/components/admin/MemberDrawer.tsx`
10. `apps/web/app/(admin)/admin/tags/page.tsx`
11. `apps/web/src/components/admin/TagQueuePanel.tsx`
12. `apps/web/app/(admin)/admin/schema/page.tsx`
13. `apps/web/src/components/admin/SchemaDiffPanel.tsx`
14. `apps/web/app/(admin)/admin/meetings/page.tsx`
15. `apps/web/src/components/admin/MeetingPanel.tsx`

## 実装境界

- Server Component GET: `fetchAdmin` を使用する。
- Client mutation: `/api/admin/*` proxy を使用する。
- D1 / apps/api repository は apps/web から import しない。
- tag / schema / attendance の状態遷移本体は 04c API と 07系後続 workflow の責務。

## Sanity Check

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test
rg -n "repository|D1Database|wrangler" apps/web
```

## Handoff

- 07a: `TagQueuePanel` の resolve UI
- 07b: `SchemaDiffPanel` の alias UI
- 07c: `MeetingPanel` の attendance UI
- 08a: API contract / authorization tests
- 08b: Playwright visual smoke
