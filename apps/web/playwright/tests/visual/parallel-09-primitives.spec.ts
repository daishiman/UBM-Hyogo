import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

const evidenceDir = path.resolve(
  process.cwd(),
  "../../docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots",
);

const shots = [
  { id: "01-formfield-error", route: "/visual-harness/formfield-error", selector: '[data-component="form-field"]' },
  { id: "02-icon-4sizes", route: "/visual-harness/icon-4sizes", selector: '[data-visual="icon-grid"]' },
  { id: "03-breadcrumb", route: "/visual-harness/breadcrumb", selector: 'nav[aria-label="breadcrumb"]' },
  { id: "04-focus-visible", route: "/visual-harness/focus-visible", selector: '[data-visual="focus-grid"]' },
  { id: "05-pagination-disabled", route: "/visual-harness/pagination-disabled", selector: '[data-component="pagination"]' },
  { id: "06-empty-state", route: "/visual-harness/empty-state", selector: ".ui-empty-state" },
] as const;

test.describe("parallel-09 primitives visual evidence", () => {
  for (const shot of shots) {
    test(`${shot.id} 1x and 2x screenshots`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Visual evidence is captured on Chromium only.");
      await mkdir(evidenceDir, { recursive: true });

      await page.goto(shot.route);
      const target = page.locator(shot.selector).first();
      await expect(target).toBeVisible();
      await target.screenshot({ path: path.join(evidenceDir, `${shot.id}.png`) });

      await page.setViewportSize({ width: 2560, height: 1600 });
      await page.goto(shot.route);
      const target2x = page.locator(shot.selector).first();
      await expect(target2x).toBeVisible();
      await target2x.screenshot({ path: path.join(evidenceDir, `${shot.id}@2x.png`) });
    });
  }
});
