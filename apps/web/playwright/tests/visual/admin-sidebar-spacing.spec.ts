import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

const evidenceDir = path.resolve(
  process.env.ADMIN_SIDEBAR_SPACING_EVIDENCE_DIR ??
    path.join(
      process.cwd(),
      "../../docs/30-workflows/admin-sidebar-collapsed-icon-spacing-parity/outputs/phase-11/screenshots",
    ),
);

const shots = [
  {
    id: "sidebar-collapsed-after",
    route: "/visual-harness/admin-sidebar-spacing-collapsed",
    selector: '[data-shell="sidebar"]',
  },
  {
    id: "sidebar-expanded-reference",
    route: "/visual-harness/admin-sidebar-spacing-expanded",
    selector: '[data-shell="sidebar"]',
  },
  {
    id: "sidebar-collapsed-after-footer",
    route: "/visual-harness/admin-sidebar-spacing-collapsed",
    selector: '[data-shell-block="sidebar-footer"]',
  },
] as const;

test.describe("admin sidebar collapsed icon spacing visual evidence", () => {
  test.setTimeout(120_000);

  for (const shot of shots) {
    test(`${shot.id} screenshot`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Phase 11 visual evidence is captured on Chromium.");
      await mkdir(evidenceDir, { recursive: true });

      await page.goto(shot.route);
      const target = page.locator(shot.selector).first();
      await expect(target).toBeVisible();
      await expect(page.locator('[data-shell="sidebar"] [data-shell-block="nav-item"]').first()).toBeVisible();
      await target.screenshot({ path: path.join(evidenceDir, `${shot.id}.png`) });
    });
  }
});
