# Phase 10 成果物: 最終レビュー

## DoD 照合

- [x] `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` が存在し、`GET` が `image/png` を返す
- [x] `apps/web/app/(public)/members/[id]/page.tsx` の `generateMetadata` が `ogImage: /members/<id>/opengraph-image` を渡す（not-found 分岐除く）
- [x] `apps/web/src/lib/seo/site-metadata.ts` の `PageMetaInput.ogImage` に doc comment 追加
- [x] unit spec 新規作成、4 cases PASS
- [x] Playwright `public-metadata.spec.ts` に 3 ケース追加（member-specific og:image / PNG response / 404）
- [x] `pnpm typecheck` / `pnpm lint` / `build` 全 PASS

## 残課題

- 動的 OG image は explicit route handler で `/members/<id>/opengraph-image` を返す。Next.js metadata special file の hash suffix route は使わない。

## 判定

**APPROVE**（実装サイクル内で完結）
