# Phase 10: テスト追加 — Playwright smoke

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 | 前 | 9 | 次 | 11 |
| 状態 | completed |

## 目的
公開 4 ルート + `/sitemap.xml` + `/robots.txt` + `/opengraph-image` に対する Playwright smoke を追加し、HTML/XML/PNG レスポンスの contract を E2E で固定する。

## 10.1 変更対象ファイル

| ファイル | 種別 |
| --- | --- |
| `apps/web/playwright/tests/public-metadata.spec.ts` | 新規 |

## 10.2 spec 内容

```ts
import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/members", "/register"] as const;
const SEEDED_MEMBER_DETAIL_PATH = "/members/playwright-public-member";

test.describe("public pages OGP / sitemap / robots", () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} exposes OG and Twitter meta tags`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
    });
  }

  test("/members/[id] exposes member detail OG and Twitter meta tags", async ({ page }) => {
    await page.goto(SEEDED_MEMBER_DETAIL_PATH);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
  });

  test("/sitemap.xml returns XML with static routes", async ({ request, baseURL }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/members");
    expect(body).toContain("/register");
  });

  test("/robots.txt is served", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-Agent:\s*\*/i);
    expect(body).toContain("Sitemap:");
  });

  test("/opengraph-image returns PNG", async ({ request }) => {
    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });
});
```

## 10.3 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium  # 初回のみ
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-metadata.spec.ts
```

> Playwright 実行前提: `apps/web/playwright.config.ts` の `webServer` 設定で `pnpm dev` が起動するか、別途 dev server を立ち上げておく必要がある。既存 smoke の起動パターンを踏襲する。

## 10.4 DoD
- 上記 7 ケース（3 static route smoke + 1 member detail smoke + sitemap + robots + og image）全て PASS
- skip / `test.todo` 残留ゼロ
- `coverage/e2e/coverage-summary.json` の `lines.pct >= 80` を維持


## 実行タスク
- [ ] public metadata smoke spec を追加する
- [ ] 3 static public pages / seeded member detail / sitemap / robots / OG image の response contract を assert する
- [ ] skip / todo 残留ゼロを確認する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| E2E 対象 | `apps/web/playwright/tests/public-metadata.spec.ts` | public metadata smoke |
| Playwright config | `apps/web/playwright.config.ts` | webServer / baseURL |
| Route outputs | `/sitemap.xml`, `/robots.txt`, `/opengraph-image` | runtime response contract |


## 成果物
- `apps/web/playwright/tests/public-metadata.spec.ts` と Playwright log


## 依存 Phase 参照
- Phase 1 の成果物を参照する
- Phase 2 の成果物を参照する
- Phase 5 の成果物を参照する


## 完了条件
- [ ] 上記成果物が作成または更新されている
- [ ] 参照資料との矛盾がない
- [ ] 次 Phase が必要とする入力が本文または成果物に明記されている
