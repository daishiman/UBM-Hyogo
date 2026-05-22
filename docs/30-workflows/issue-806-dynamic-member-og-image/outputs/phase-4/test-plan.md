# Phase 4 成果物: テスト計画

source: `../../phase-4-test-plan.md` に準拠。

## 追加するテスト

### Unit (Vitest)
- `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx`（新規）
  - route handler の `image/png` response
  - 正常 path: profile 存在時に PNG Response 返却
  - 404 path: `FetchPublicNotFoundError` → `notFound()` 呼出
  - 例外 path: その他 error rethrow

### E2E (Playwright)
- `apps/web/playwright/tests/public-metadata.spec.ts` に 3 ケース追加
  - member-specific og:image / twitter:image path のアサート
  - `/members/[id]/opengraph-image` が PNG 200 返却
  - 存在しない id で 404 返却

## 期待カバレッジ
- `opengraph-image/route.tsx`: line ≥ 90%, branch ≥ 80%
