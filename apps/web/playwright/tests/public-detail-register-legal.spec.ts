// task-12 Playwright smoke: 公開詳細 / 登録 / 法務 4 ページ + 404 ページの 200/404 + axe critical=0
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from '../fixtures/coverage';
import type { Page } from '../fixtures/coverage';
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SEED_MEMBER_ID = process.env.PUBLIC_SMOKE_MEMBER_ID ?? "fixture-1";
const EVIDENCE_ROOT = path.resolve(
  process.cwd(),
  "../../docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11",
);
const SCREENSHOT_DIR = path.join(EVIDENCE_ROOT, "screenshots");
const EVIDENCE_DIR = path.join(EVIDENCE_ROOT, "evidence");
const axeReports: Record<
  string,
  { criticalCount: number; violationCount: number }
> = {};

async function captureEvidence(page: Page, name: string) {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  });
  const axe = await new AxeBuilder({ page }).analyze();
  axeReports[name] = {
    criticalCount: axe.violations.filter((v) => v.impact === "critical").length,
    violationCount: axe.violations.length,
  };
  await writeFile(
    path.join(EVIDENCE_DIR, "axe-report.json"),
    `${JSON.stringify(axeReports, null, 2)}\n`,
  );
  expect(axe.violations.filter((v) => v.impact === "critical")).toEqual([]);
}

test.describe("public detail / register / legal", () => {
  test("/members/[id] renders profile hero and sections", async ({ page }) => {
    const res = await page.goto(`/members/${SEED_MEMBER_ID}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('[data-component="profile-hero"]')).toBeVisible();
    await expect(page.locator("[data-section]").first()).toBeVisible();
    await expect(page.locator("[data-stable-key]").first()).toBeVisible();
    await captureEvidence(page, "member-detail");
  });

  test("/members/non-existent triggers notFound", async ({ page }) => {
    // Next.js dev (Turbopack/webpack) は async server component 内の notFound() で
    // 404 を返さず 200 + not-found.tsx を返すため、HTTP status ではなくレンダリング
    // 結果（not-found page の data-testid）で検証する。production build では 404 を返す。
    const res = await page.goto("/members/__definitely_not_exist__");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('[data-testid="not-found"]')).toBeVisible();
    await captureEvidence(page, "not-found");
  });

  test("/register exposes external CTA with responderUrl", async ({
    page,
  }) => {
    const res = await page.goto("/register");
    expect(res?.status()).toBe(200);
    const cta = page.locator('[data-role="register-cta"]');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("target", "_blank");
    await expect(cta).toHaveAttribute("rel", /noopener/);
    await expect(cta).toHaveAttribute("rel", /noreferrer/);
    await captureEvidence(page, "register");
  });

  test("/privacy renders LegalProse", async ({ page }) => {
    const res = await page.goto("/privacy");
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "プライバシーポリシー" }),
    ).toBeVisible();
    await expect(page.locator('[data-component="legal-prose"]')).toBeVisible();
    await captureEvidence(page, "privacy");
  });

  test("/terms renders LegalProse", async ({ page }) => {
    const res = await page.goto("/terms");
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "利用規約" }),
    ).toBeVisible();
    await expect(page.locator('[data-component="legal-prose"]')).toBeVisible();
    await captureEvidence(page, "terms");
  });
});
