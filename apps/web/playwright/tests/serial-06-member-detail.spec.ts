import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { test, expect } from "../fixtures/auth";

const PHASE11_DIR = path.resolve(
  process.cwd(),
  "../../docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/outputs/phase-11",
);
const SCREENSHOT_DIR = path.join(PHASE11_DIR, "screenshots");

test.describe("serial-06 public member detail binding", () => {
  test("renders API-backed public fields and captures Phase 11 screenshot", async ({
    page,
    mockApi,
  }) => {
    void mockApi;

    const response = await page.goto("/members/sample-001");

    expect(response?.status()).toBe(200);
    await expect(page.locator('[data-page="public-member-detail"]')).toBeVisible();
    await expect(page.locator('[data-component="profile-hero"]')).toBeVisible();
    await expect(page.locator('[data-section="profile"]')).toBeVisible();
    await expect(page.locator('[data-stable-key="urlOthers"]')).toBeVisible();
    await expect(page.locator('[data-section="activity"]')).toBeVisible();
    await expect(page.locator('[data-stable-key="attendance:session_task18"]')).toBeVisible();

    await mkdir(SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "public-member-detail.png"),
      fullPage: true,
    });
    await writeFile(
      path.join(PHASE11_DIR, "dom-scrape-public-member-detail.txt"),
      `${await page.locator('[data-page="public-member-detail"]').evaluate((node) => node.textContent)}\n`,
    );
  });
});
