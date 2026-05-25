# Unit Test Result

Status: passed (local execution 2026-05-25).

## Command

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx
```

## Result

```
Test Files  2 passed (2)
     Tests  19 passed (19)
  Duration  1.64s
```

- `AdminSectionError.spec.tsx`: 12 tests (TC-SE-01..05 既存 + AS-1..7 追加)
- `AdminSectionErrorClient.spec.tsx`: 7 tests (AC-1, AC-2, AC-5, AC-6, AC-7, AC-8, AC-9 jest-axe)

## Aux gates

- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`: 0 error
- `mise exec -- pnpm --filter @ubm-hyogo/web lint`: 0 error / 0 warning
- `mise exec -- pnpm typecheck`: passed
- `mise exec -- pnpm lint`: passed
- `mise exec -- pnpm verify:tokens`: passed (`design tokens in sync`)
