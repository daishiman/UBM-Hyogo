# Phase 4: テスト計画 (RED)

- `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx`（新規・8 ケース）
- `apps/web/src/lib/constants/__tests__/form.spec.ts`（新規・1 ケース）

repo に `@testing-library/jest-dom` の setup がないため、`toBeInTheDocument` / `toHaveAttribute` は使わず、
`getAttribute()` + `not.toBeNull()` のバニラ Chai matcher を採用。
