# Phase 11: 実装結果サマリ

## 追加・変更ファイル

新規:
- `apps/web/src/lib/seo/site-metadata.ts`
- `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts`
- `apps/web/app/sitemap.ts`
- `apps/web/app/robots.ts`
- `apps/web/app/opengraph-image.tsx`
- `apps/web/playwright/tests/public-metadata.spec.ts`

編集:
- `apps/web/app/layout.tsx` — root metadata を `buildBaseMetadata()` 経由化
- `apps/web/app/page.tsx` — `/` metadata 追加
- `apps/web/app/(public)/members/page.tsx` — `/members` metadata 追加
- `apps/web/app/(public)/members/[id]/page.tsx` — `generateMetadata` を OGP/Twitter 拡張
- `apps/web/app/(public)/register/page.tsx` — `/register` metadata 追加

## 検証コマンド結果

- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` — PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web lint` — PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/seo` — 621 passed / 1 skipped（追加 site-metadata.spec を含む全 PASS）

## 実装メモ

- `site-metadata.ts` 内で `@/` alias の代わりに相対 import (`../env`) を採用。
  - 理由: monorepo root の `vitest.config.ts` に `@/` alias が定義されておらず、
    既存 spec も相対 import で統一されているため。
- Playwright smoke は dev server / seed 状態を前提とするため CI/ローカルで別途実行する。
  2026-05-18 の追加検証で `scripts/e2e-mock-api.mjs` 相当の mock API と local dev server を使い、
  `apps/web/playwright/tests/public-metadata.spec.ts --project=desktop-chromium` が 7/7 PASS。
- `getSiteUrl()` は `apps/web/wrangler.toml` の `AUTH_URL` 正本に合わせ、
  production/staging host を `ubm-hyogo-web*.daishimanju.workers.dev` に補正した。
