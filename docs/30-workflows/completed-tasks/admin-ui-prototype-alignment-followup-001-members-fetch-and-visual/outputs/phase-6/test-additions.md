# Phase 6 — 追加 test 一覧

| spec | 対象 | 新規/差替 |
|------|------|----------|
| `apps/web/app/api/admin/[...path]/route.spec.ts` | T-5.1 proxy fail-fast / 401 propagation / 403 | 新規 |
| `apps/web/src/features/admin/adapters/__tests__/members-view-model.spec.ts` | T-5.2 adapter additive 派生 / hue 決定論 / updatedAt fallback / deleted meta | 新規 |
| `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | T-5.3 列構成 / avatar / tags +N / 退会 Chip / Switch / edit | 差替（旧 task-15 spec） |
| `apps/web/src/features/admin/components/__tests__/MembersFilters.spec.tsx` | T-5.4 pill 4種 / debounced search / count | 差替（旧 task-15 spec） |
| `apps/web/src/features/admin/components/__tests__/MembersPageHead.spec.tsx` | T-5.5 eyebrow / h-page / 2 disabled CTA | 新規 |
| `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | T-5.6 head / VISIBILITY / KVList / DELETED / foot 3 button | 差替（旧 task-15 spec） |
| `apps/web/src/components/ui/__tests__/PillNav.spec.tsx` | T-5.7 PillNav primitive | 新規 |

最終結果: 1163 passed / 1 skipped / 0 failed
