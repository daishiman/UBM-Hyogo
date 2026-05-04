# Phase 4 Output: テスト戦略

## 判定

Focused API / Web / shared schema tests cover the implementation contract.

## Test Set

- `apps/api/src/routes/admin/members.test.ts`
- `apps/api/src/routes/admin/member-delete.test.ts`
- `apps/web/src/components/admin/__tests__/MembersClient.test.tsx`
- `packages/shared/src/zod/viewmodel.test.ts`

## Boundary Cases

- invalid `sort` / `density` / `zone`: 422
- `q` over 200 normalized chars: 422
- `page=0`: 422
- very large `page`: 200 + empty `members`
- 6 or more tags: 422
