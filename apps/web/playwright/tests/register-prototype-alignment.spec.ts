import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "../fixtures/coverage";

const EVIDENCE_ROOT = path.resolve(
  process.cwd(),
  "../../docs/30-workflows/register-page-prototype-alignment/outputs/phase-11",
);
const SCREENSHOT_DIR = path.join(EVIDENCE_ROOT, "screenshots");
const EVIDENCE_DIR = path.join(EVIDENCE_ROOT, "evidence");

test("/register matches member form prototype sections", async ({ page }) => {
  const response = await page.goto("/register");
  expect(response?.status()).toBeLessThan(500);

  await expect(
    page.getByRole("heading", { name: "メンバー登録" }),
  ).toBeVisible();
  await expect(page.locator('[data-component="register-callout"]')).toBeVisible();
  await expect(page.locator('[data-component="register-step-grid"]')).toBeVisible();
  await expect(page.locator('[data-component="register-faq"]')).toBeVisible();
  await expect(page.locator('[data-component="register-bottom-cta"]')).toBeVisible();

  await expect(page.locator(".register-step-card")).toHaveCount(3);
  await expect(page.locator('[data-component="register-faq"] details')).toHaveCount(3);

  const cta = page.locator('[data-role="register-cta"]');
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("target", "_blank");
  await expect(cta).toHaveAttribute("rel", /noopener/);
  await expect(cta).toHaveAttribute("rel", /noreferrer/);

  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "register-desktop.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "register-mobile.png"),
    fullPage: true,
  });

  const axe = await new AxeBuilder({ page }).analyze();
  await writeFile(
    path.join(EVIDENCE_DIR, "axe-results.json"),
    `${JSON.stringify(
      {
        criticalCount: axe.violations.filter((v) => v.impact === "critical")
          .length,
        violationCount: axe.violations.length,
      },
      null,
      2,
    )}\n`,
  );
  expect(axe.violations.filter((v) => v.impact === "critical")).toEqual([]);
});
