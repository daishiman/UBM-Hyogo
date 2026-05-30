import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

const screenshotDir = path.resolve(
  process.env.SIDEBAR_USER_MENU_EVIDENCE_DIR ??
    path.join(
      process.cwd(),
      "../../docs/30-workflows/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/screenshots",
    ),
);

const shots = [
  { id: "user-menu-viewer", selector: '[data-visual="user-menu-viewer"]' },
  { id: "user-menu-member", selector: '[data-visual="user-menu-member"]' },
  { id: "user-menu-admin", selector: '[data-visual="user-menu-admin"]' },
  { id: "user-menu-collapsed", selector: '[data-visual="user-menu-collapsed"]' },
] as const;

test.describe("SidebarUserMenu visual evidence", () => {
  test.setTimeout(120_000);

  for (const shot of shots) {
    test(`${shot.id} screenshot`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Phase 11 visual evidence is captured on Chromium.");
      await mkdir(screenshotDir, { recursive: true });

      await page.goto("/visual-harness/sidebar-user-menu");
      const target = page.locator(shot.selector).first();
      await expect(target).toBeVisible();
      await target.locator("summary").click();
      await expect(target.locator('[role="menu"]')).toBeVisible();
      await target.screenshot({ path: path.join(screenshotDir, `${shot.id}.png`) });
    });
  }
});
