import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, memberLogin, test } from "../fixtures/auth";

const workflowRoot = join(
  process.cwd(),
  "../../docs/30-workflows/member-publish-recovery-form-ops-and-admin-link",
);
const screenshotDir = join(workflowRoot, "outputs/phase-11/screenshots");
const metadataPath = join(workflowRoot, "outputs/phase-11/phase11-capture-metadata.json");

function screenshotPath(name: string): string {
  mkdirSync(screenshotDir, { recursive: true });
  return join(screenshotDir, name);
}

test.describe("member publish recovery local visual evidence", () => {
  test.skip(
    process.env.PLAYWRIGHT_MEMBER_PUBLISH_RECOVERY !== "1",
    "PLAYWRIGHT_MEMBER_PUBLISH_RECOVERY=1 captures workflow Phase 11 screenshots",
  );

  test("captures Task A/B admin sync panels and Task D form link", async ({
    adminPage,
  }) => {
    await adminPage.goto("/admin/sync-status", { waitUntil: "domcontentloaded" });
    await expect(
      adminPage.getByRole("heading", { name: "Google Form 反映診断" }),
    ).toBeVisible();
    await expect(adminPage.getByText("公開状態 backfill")).toBeVisible();
    await expect(adminPage.getByText("フォーム回答の再取込")).toBeVisible();
    await adminPage.screenshot({
      path: screenshotPath("a-backfill-panel.png"),
      fullPage: true,
    });
    await adminPage.screenshot({
      path: screenshotPath("b-manual-resync-panel.png"),
      fullPage: true,
    });

    await expect(
      adminPage.getByRole("link", { name: /Form回答/ }),
    ).toHaveAttribute("target", "_blank");
    await adminPage.screenshot({
      path: screenshotPath("d-admin-form-link.png"),
      fullPage: true,
    });
  });

  test("captures Task C public members reflection timing note", async ({ page }) => {
    await memberLogin(page.context());
    await page.goto("/members", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByLabel("Google Form 反映タイミング"),
    ).toBeVisible();
    await page.screenshot({
      path: screenshotPath("c-members-reflection-note.png"),
      fullPage: true,
    });
  });

  test("captures Task C member profile reflection timing note", async ({
    memberPage,
  }) => {
    await memberPage.goto("/profile", { waitUntil: "domcontentloaded" });
    await expect(
      memberPage.getByLabel("Google Form 反映タイミング"),
    ).toBeVisible();
    await memberPage.screenshot({
      path: screenshotPath("c-profile-publish-state.png"),
      fullPage: true,
    });
  });

  test.afterAll(async () => {
    mkdirSync(join(workflowRoot, "outputs/phase-11"), { recursive: true });
    writeFileSync(
      metadataPath,
      `${JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          source:
            "PLAYWRIGHT_MEMBER_PUBLISH_RECOVERY=1 pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/member-publish-recovery-form-ops-and-admin-link.spec.ts --project=chromium",
          screenshots: [
            "outputs/phase-11/screenshots/a-backfill-panel.png",
            "outputs/phase-11/screenshots/b-manual-resync-panel.png",
            "outputs/phase-11/screenshots/c-members-reflection-note.png",
            "outputs/phase-11/screenshots/c-profile-publish-state.png",
            "outputs/phase-11/screenshots/d-admin-form-link.png",
          ],
        },
        null,
        2,
      )}\n`,
    );
  });
});
