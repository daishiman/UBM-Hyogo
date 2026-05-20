import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/members", "/register"] as const;
const SEEDED_MEMBER_DETAIL_PATH = "/members/playwright-public-member";

test.describe("public pages OGP / sitemap / robots", () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} exposes OG and Twitter meta tags`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(
        page.locator('meta[property="og:description"]'),
      ).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
    });
  }

  test("/members/[id] exposes member detail OG and Twitter meta tags", async ({
    page,
  }) => {
    await page.goto(SEEDED_MEMBER_DETAIL_PATH);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(
      1,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
  });

  test("/sitemap.xml returns XML with static routes", async ({ request }) => {
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
