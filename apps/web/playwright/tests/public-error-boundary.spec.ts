import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { memberLogin } from "../fixtures/auth";

const screenshotDir = join(
  process.cwd(),
  "../../docs/30-workflows/completed-tasks/issue-880-public-segment-error-loading-boundary/outputs/phase-11/screenshots",
);

const screenshotPath = (name: string) => {
  mkdirSync(screenshotDir, { recursive: true });
  return join(screenshotDir, name);
};

test.describe("(public) error boundary @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await memberLogin(page.context());
  });

  test("force throw renders (public)/error.tsx within public AppShell", async ({ page }) => {
    await page.goto("/error-boundary-smoke");

    await expect(page.locator('[data-route-group="public"]')).toBeVisible();
    await expect(page.locator('[data-page="error"]')).toBeVisible();

    const alert = page.locator('[data-page="error"] [role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert.getByRole("heading", { level: 1 })).toHaveText(
      "ページを表示できませんでした",
    );

    await expect(page.getByRole("button", { name: "再試行する" })).toBeVisible();
    await expect(page.getByRole("link", { name: "会員一覧へ戻る" })).toHaveAttribute(
      "href",
      "/members",
    );
    await expect(page.getByRole("link", { name: "トップへ戻る" })).toHaveAttribute(
      "href",
      "/",
    );

    await page.screenshot({
      path: screenshotPath("public-error-boundary.png"),
      fullPage: true,
    });
  });

  test("focus moves to heading on boundary mount", async ({ page }) => {
    await page.goto("/error-boundary-smoke");
    await expect(
      page.locator('[data-page="error"]').getByRole("heading", { level: 1 }),
    ).toBeVisible();
    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.activeElement?.tagName?.toLowerCase() ?? null,
          ),
        { timeout: 5000 },
      )
      .toBe("h1");
  });
});
