import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Locator } from "@playwright/test";

import { expect, memberLogin, test } from "../fixtures/auth";

const PHASE11_DIR = path.resolve(
  process.cwd(),
  "../../docs/30-workflows/issue-1029-public-member-photo-display/outputs/phase-11",
);
const SCREENSHOT_DIR = path.join(PHASE11_DIR, "screenshots");

const photoImg = (scope: Locator) => scope.locator(".ui-avatar--photo img");

test.describe("issue-1029 public member photo display", () => {
  test.beforeEach(async ({ page }) => {
    await memberLogin(page.context());
  });

  test("captures list and detail screenshots with public-safe photoUrl", async ({
    page,
    mockApi,
  }) => {
    void mockApi;
    await mkdir(SCREENSHOT_DIR, { recursive: true });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/members", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-component="member-grid"]')).toBeVisible();
    const firstCard = page.locator('[data-component="member-card"]').first();
    await expect(firstCard).toBeVisible();
    await expect(photoImg(firstCard)).toHaveAttribute("src", /^data:image\/svg\+xml;base64,/);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "public-members-photo-list-desktop.png"),
      fullPage: true,
    });

    await page.goto("/members/sample-001", { waitUntil: "domcontentloaded" });
    const hero = page.locator('[data-component="profile-hero"]');
    await expect(hero).toBeVisible();
    await expect(photoImg(hero)).toHaveAttribute("src", /^data:image\/svg\+xml;base64,/);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "public-member-photo-detail-desktop.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/members", { waitUntil: "domcontentloaded" });
    await expect(photoImg(page.locator('[data-component="member-card"]').first())).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "public-members-photo-list-mobile.png"),
      fullPage: true,
    });

    await writeFile(
      path.join(PHASE11_DIR, "runtime-visual-summary.md"),
      [
        "# Phase 11 Runtime Visual Summary",
        "",
        "- `public-members-photo-list-desktop.png`: `/members` desktop list shows `photoUrl` as an avatar image.",
        "- `public-member-photo-detail-desktop.png`: `/members/sample-001` detail hero shows `photoUrl` as an avatar image.",
        "- `public-members-photo-list-mobile.png`: `/members` mobile list keeps the photo avatar visible without layout overlap.",
        "",
      ].join("\n"),
    );
  });
});
