# Phase 2 成果物: 設計

source: `../../phase-2-design.md` に準拠。

## 配置
- 新規: `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`
- 新規: `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx`
- 修正: `apps/web/app/(public)/members/[id]/page.tsx` (`generateMetadata` に `ogImage` 追加)
- 修正: `apps/web/src/lib/seo/site-metadata.ts` (`PageMetaInput.ogImage` に doc comment)
- 修正: `apps/web/playwright/tests/public-metadata.spec.ts` (member-specific og:image / PNG / 404)

## 設計上のポイント
- route-level `runtime = "edge"` は指定しない（OpenNext Cloudflare adapter 互換）
- publicConsent ガードは API contract に委譲
- 404 は `notFound()` 経由
- 共通 fetch helper 化はスコープ外（2 callsite で abstraction cost 過大）
