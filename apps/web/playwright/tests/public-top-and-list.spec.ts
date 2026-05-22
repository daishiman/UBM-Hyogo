// task-11 AC-10: 公開トップ + メンバー一覧 smoke。
// 5 ケース: `/`, `/members`, `?density=list`, `?density=invalid`, `?q=zzz_no_match_zzz`
// 各ケースで axe critical violations = 0 を確認。

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from '../fixtures/coverage';
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const evidenceDir = join(
  process.cwd(),
  "../../docs/30-workflows/task-11-public-top-and-member-list/outputs/phase-11/evidence",
);

const screenshotPath = (name: string) => {
  mkdirSync(evidenceDir, { recursive: true });
  return join(evidenceDir, name);
};

const assertNoCriticalAxe = async (page: import("@playwright/test").Page) => {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const critical = result.violations.filter(
    (v) => v.impact === "critical",
  );
  expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
};

test.describe("public top & members list @critical-route", () => {
  test("`/` shows hero / stats / zone-intro", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.locator('[data-component="hero"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('[data-stat="total"]'),
    ).toHaveCount(1);
    const cta = page.locator('[data-component="call-to-action-cta"]');
    await expect(cta).toBeVisible();
    const ctaLink = cta.getByRole("link", { name: "回答フォームを開く" });
    await expect(ctaLink).toHaveAttribute("target", "_blank");
    await expect(ctaLink).toHaveAttribute("rel", "noopener noreferrer");
    await page.screenshot({
      path: screenshotPath("home-screenshot.png"),
      fullPage: true,
    });
    await assertNoCriticalAxe(page);
  });

  test("`/members` default = grid (comfy)", async ({ page }) => {
    await page.goto("/members");
    await expect(
      page.locator('[data-component="member-grid"]'),
    ).toBeVisible();
    await expect(page.locator('[data-component="member-card"]')).not.toHaveCount(0);
    await page.screenshot({
      path: screenshotPath("members-comfy-screenshot.png"),
      fullPage: true,
    });
    await assertNoCriticalAxe(page);
  });

  test("`/members?density=list` shows table", async ({ page }) => {
    await page.goto("/members?density=list");
    await expect(
      page.locator('table[data-component="member-table"]'),
    ).toBeVisible();
    await expect(page.locator('table[data-component="member-table"] tbody tr')).not.toHaveCount(0);
    await page.screenshot({
      path: screenshotPath("members-list-screenshot.png"),
      fullPage: true,
    });
    await assertNoCriticalAxe(page);
  });

  test("`/members?density=invalid` falls back to comfy grid", async ({
    page,
  }) => {
    await page.goto("/members?density=invalid");
    // density=invalid → comfy fallback。table は出ない。
    await expect(
      page.locator('table[data-component="member-table"]'),
    ).toHaveCount(0);
    await assertNoCriticalAxe(page);
  });

  test("`/members?q=zzz_no_match_zzz` shows EmptyState", async ({ page }) => {
    await page.goto("/members?q=zzz_no_match_zzz");
    await expect(
      page.locator('[data-component="empty-state"]'),
    ).toBeVisible();
    await page.screenshot({
      path: screenshotPath("members-empty-screenshot.png"),
      fullPage: true,
    });
    await assertNoCriticalAxe(page);
  });
});
