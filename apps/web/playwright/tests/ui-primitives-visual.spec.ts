import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const VARIANTS = [
  ["Button", "primary"],
  ["Button", "accent"],
  ["Button", "ghost"],
  ["Button", "soft"],
  ["Button", "danger"],
  ["Button", "loading"],
  ["Card", "default"],
  ["Card", "with-header"],
  ["Card", "with-footer"],
  ["Badge", "default"],
  ["Badge", "success"],
  ["Badge", "warning"],
  ["Badge", "danger"],
  ["Badge", "info"],
  ["Input", "default"],
  ["Input", "with-label"],
  ["Input", "error"],
  ["Input", "disabled"],
  ["Select", "default"],
  ["Select", "with-placeholder"],
  ["Select", "disabled"],
  ["Sidebar", "default"],
  ["Sidebar", "with-footer"],
  ["Stat", "default"],
  ["Stat", "with-delta-up"],
  ["Stat", "with-delta-down"],
  ["EmptyState", "default"],
  ["EmptyState", "with-action"],
  ["Avatar", "initials-fallback"],
  ["Avatar", "large"],
  ["Field", "default"],
  ["Field", "with-error"],
  ["Field", "with-hint"],
  ["Banner", "info"],
  ["Banner", "success"],
  ["Banner", "warning"],
  ["Banner", "danger"],
] as const;

function evidenceDir(testInfo: { outputDir: string }) {
  return process.env.PLAYWRIGHT_EVIDENCE_DIR ?? testInfo.outputDir;
}

test.describe("ui-primitives-visual", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/primitives-harness");
    await expect(page.getByTestId("primitives-harness")).toBeVisible();
  });

  for (const [primitive, variant] of VARIANTS) {
    test(`screenshot: ${primitive}/${variant}`, async ({ page }, testInfo) => {
      const locator = page.locator(`section[data-primitive="${primitive}"][data-variant="${variant}"]`);
      await expect(locator).toBeVisible();
      const screenshotsDir = path.join(evidenceDir(testInfo), "screenshots");
      mkdirSync(screenshotsDir, { recursive: true });
      await locator.screenshot({ path: path.join(screenshotsDir, `${primitive}-${variant}.png`) });
    });
  }

  test("axe: harness page", async ({ page }, testInfo) => {
    const results = await new AxeBuilder({ page }).analyze();
    const outputDir = evidenceDir(testInfo);
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(path.join(outputDir, "axe-report.json"), JSON.stringify(results, null, 2));
    expect(results.violations).toEqual([]);
  });
});
