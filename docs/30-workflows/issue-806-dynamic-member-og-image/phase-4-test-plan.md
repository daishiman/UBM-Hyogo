# Phase 4: テスト計画

## 1. テスト戦略マトリクス

| Layer | テスト種別 | ツール | 対象 |
|---|---|---|---|
| Unit | route handler smoke | Vitest + React Testing Library (Server Component) | `opengraph-image/route.tsx` の ImageResponse / 404 分岐 |
| Integration | metadata 連携 | Vitest（site-metadata 系 spec 拡張） | `buildPageMetadata` 経由で `og:image` path が member-specific になること |
| E2E | meta tag + image response | Playwright | `/members/[id]/opengraph-image` PNG 応答 + meta path 検証 |
| Manual | 視認 | curl / browser / Twitter Card Validator (deploy 後の任意確認) | 画像内容の目視 |

## 2. 新規 / 更新する spec ファイル

### 2.1 新規: `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx`

```ts
import * as ogModule from "../opengraph-image/route";

// 実 spec は next/og を mock し、GET(new Request(...), { params }) を直接呼ぶ。
// 主要 assertion:
// - happy path: image/png response + fullName / occupation / footer を JSX tree に含む
// - occupation null path: fullName は残り、occupation block は出ない
// - FetchPublicNotFoundError: notFound() に変換
// - non-404 error: upstream error を rethrow
```

### 2.2 更新: `apps/web/playwright/tests/public-metadata.spec.ts`

`/members/[id] exposes member detail OG and Twitter meta tags` test を以下のように強化し、PNG response test を追加する。member-specific `og:image` / `twitter:image`、PNG response、404 response は任意ではなく本タスクの必須回帰テストとする。

```ts
test("/members/[id] exposes member-specific og:image path", async ({ page }) => {
  await page.goto(SEEDED_MEMBER_DETAIL_PATH);
  const og = page.locator('meta[property="og:image"]');
  const twitter = page.locator('meta[name="twitter:image"]');
  await expect(og).toHaveCount(1);
  await expect(twitter).toHaveCount(1);
  const content = await og.getAttribute("content");
  const twitterContent = await twitter.getAttribute("content");
  expect(content).toBeTruthy();
  expect(twitterContent).toBeTruthy();
  expect(content!).toContain("/members/playwright-public-member/opengraph-image");
  expect(twitterContent!).toContain("/members/playwright-public-member/opengraph-image");
});

test("/members/[id]/opengraph-image returns PNG", async ({ request }) => {
  const res = await request.get(
    `${SEEDED_MEMBER_DETAIL_PATH}/opengraph-image`,
  );
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});

test("/members/<nonexistent>/opengraph-image returns 404", async ({ request }) => {
  const res = await request.get(
    "/members/__nonexistent_member_for_og__/opengraph-image",
  );
  expect(res.status()).toBe(404);
});
```

### 2.3 任意更新: `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts`

既に `ogImage` を渡すケースが網羅されているかを確認。網羅されていなければ以下を追加:

```ts
it("buildPageMetadata uses provided ogImage when set", () => {
  const md = buildPageMetadata({
    title: "テストメンバー",
    description: "desc",
    path: "/members/m-1",
    ogImage: "/members/m-1/opengraph-image",
  });
  const og = md.openGraph as { images?: Array<{ url: string }> };
  expect(og.images?.[0].url).toBe("/members/m-1/opengraph-image");
});
```

## 3. 期待カバレッジ

| 対象 | 目標 |
|---|---|
| `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` | line ≥ 90% / branch ≥ 80% |
| `buildPageMetadata` ogImage 経路 | branch +1 ケース |

## 4. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- 'app/(public)/members/\[id\]/__tests__/opengraph-image.spec.tsx'
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/seo/__tests__/site-metadata.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-metadata.spec.ts
```
