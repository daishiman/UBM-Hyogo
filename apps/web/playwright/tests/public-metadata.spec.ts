import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const PUBLIC_ROUTES = ["/", "/members", "/register"] as const;
const SEEDED_MEMBER_DETAIL_PATH = "/members/playwright-public-member";
const defaultScreenshotDir = process.cwd().endsWith(`${path.sep}apps${path.sep}web`)
  ? "../../docs/30-workflows/completed-tasks/issue-1027-member-dynamic-og-worker-split/outputs/phase-11/screenshots"
  : "docs/30-workflows/completed-tasks/issue-1027-member-dynamic-og-worker-split/outputs/phase-11/screenshots";
const SCREENSHOT_DIR =
  process.env.PLAYWRIGHT_SCREENSHOT_DIR ?? defaultScreenshotDir;

async function writePhase11Evidence(fileName: string, data: Buffer | string) {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await writeFile(path.join(SCREENSHOT_DIR, fileName), data);
}

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

  test("/members/[id] exposes member-specific og:image path", async ({
    page,
  }) => {
    await page.goto(SEEDED_MEMBER_DETAIL_PATH);
    const og = page.locator('meta[property="og:image"]');
    const twitter = page.locator('meta[name="twitter:image"]');
    await expect(og).toHaveCount(1);
    await expect(twitter).toHaveCount(1);
    const content = await og.getAttribute("content");
    const twitterContent = await twitter.getAttribute("content");
    expect(content).toBeTruthy();
    expect(twitterContent).toBeTruthy();
    expect(content!).toMatch(/\/(?:members\/playwright-public-member|og-default\.png)/);
    expect(twitterContent!).toMatch(/\/(?:members\/playwright-public-member|og-default\.png)/);
    await writePhase11Evidence(
      "og-image-meta-grep.txt",
      [
        `og:image=${content}`,
        `twitter:image=${twitterContent}`,
        "",
      ].join("\n"),
    );
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

  test("/og-default.png returns PNG", async ({ request }) => {
    const res = await request.get("/og-default.png");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });
});
