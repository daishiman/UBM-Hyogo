# Phase 5: 実装手順

## 0. 事前確認

```bash
mise exec -- node -v   # v24.15.0
ls "apps/web/app/(public)/members/[id]/"
grep -n "fetchPublicOrNotFound" apps/web/src/lib/fetch/public.ts
grep -n "ogImage\|buildPageMetadata" apps/web/src/lib/seo/site-metadata.ts
```

## 1. Step 1: `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` 新規作成

Phase 2 §3 の snippet をそのまま作成。Next.js 16 App Router 互換のため `params` は `Promise<{ id: string }>` とし、先頭で `const { id } = await params;` に正規化してから `encodeURIComponent(id)` を使う。

> 注意: relative import の階層は `apps/web/app/(public)/members/[id]/` から `apps/web/src/lib/fetch/public.ts` への到達で `../../../../src/lib/fetch/public`（4 階層）となる。`page.tsx` の現行 import と整合する。

## 2. Step 2: `apps/web/app/(public)/members/[id]/page.tsx` 修正

`generateMetadata` の `return buildPageMetadata({...})` ブロックに `ogImage` フィールドを追加（Phase 2 §4 の diff 参照）。`twitterCard: "summary"` の直後に追加すること。

## 3. Step 3: `apps/web/src/lib/seo/site-metadata.ts` 微修正

`PageMetaInput.ogImage` の上に doc comment を 1 行追加（Phase 2 §5 の diff 参照）。

## 4. Step 4: Unit test 新規作成

`apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` を Phase 4 §2.1 snippet で作成。

> `__tests__` ディレクトリが未存在なら同時作成。テストファイル拡張子は `*.spec.tsx`（`*.test.*` は禁止 / CLAUDE.md 不変条件 #8）。

## 5. Step 5: Playwright spec 更新

`apps/web/playwright/tests/public-metadata.spec.ts` に Phase 4 §2.2 の 3 ケースを追加。既存の `/members/[id] exposes member detail OG and Twitter meta tags` test はそのまま残し、追加する。

## 6. Step 6: site-metadata spec の補強（任意）

`apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` を一読し、`ogImage` 引数を渡すケースが網羅されていなければ Phase 4 §2.3 の test を追加。

## 7. Step 7: 型・lint チェック

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

エラーがあれば最大 3 サイクルで修正。

## 8. Step 8: Unit テスト実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(public)/members/\\[id\\]/__tests__/opengraph-image.spec.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/seo/__tests__/site-metadata.spec.ts
```

## 9. Step 9: ビルド確認（Workers bundle 互換性）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
```

`next build --webpack` が success かつ `apps/web/.open-next/` 配下に bundle が生成されることを確認。`[project]/...` 仮想 module specifier が混入していないことを `grep -r "\\[project\\]" apps/web/.open-next | head` で確認。

## 10. Step 10: ローカル動作確認（E2E は Phase 11 で実施）

```bash
mise exec -- bash scripts/with-env.sh pnpm --filter @ubm-hyogo/web dev
# 別 terminal
curl -sI http://localhost:3000/members/playwright-public-member/opengraph-image
# → HTTP/1.1 200 / Content-Type: image/png
curl -s http://localhost:3000/members/playwright-public-member | grep 'og:image'
# → content="/members/playwright-public-member/opengraph-image" を含む
```

## 11. DoD（Definition of Done）

- [x] `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` が存在し、`GET` が `image/png` を返し、route-level `runtime = "edge"` を指定していない
- [ ] `apps/web/app/(public)/members/[id]/page.tsx` の `generateMetadata` が `ogImage: "/members/<id>/opengraph-image"` を渡す（not-found 分岐除く）
- [ ] `apps/web/src/lib/seo/site-metadata.ts` の `PageMetaInput.ogImage` に doc comment 追加
- [ ] `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` が新規作成され全 case PASS
- [ ] Playwright `public-metadata.spec.ts` に member-specific `og:image` / `twitter:image` / PNG response / 404 の 4 観点追加
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web build` 全 PASS
- [ ] curl で `og:image` が member-specific path、`/opengraph-image` 直リクエストが 200 PNG を確認
