import { expect, test } from "@playwright/test";
import path from "node:path";

const evidenceDir =
  process.env.PLAYWRIGHT_EVIDENCE_DIR ??
  path.resolve(
    process.cwd(),
    "../../docs/30-workflows/task-parallel-07-auth-and-shared/outputs/phase-11",
  );

const cases = [
  ["login-loading", "light", "login-loading-light.png"],
  ["login-loading", "dark", "login-loading-dark.png"],
  ["login-error", "light", "login-error-light.png"],
  ["login-error", "dark", "login-error-dark.png"],
  ["root-error", "light", "root-error-light.png"],
  ["root-error", "dark", "root-error-dark.png"],
  ["profile-loading", "light", "profile-loading-light.png"],
  ["profile-loading", "dark", "profile-loading-dark.png"],
] as const;

test.describe("parallel-07 auth-and-shared visual evidence", () => {
  for (const [view, theme, filename] of cases) {
    test(`${view} ${theme}`, async ({ page }) => {
      await page.goto(`/parallel-07-harness?view=${view}&theme=${theme}`);
      await expect(page.locator('[data-page="parallel-07-harness"]')).toHaveAttribute(
        "data-view",
        view,
      );
      await expect(page.locator('[data-page="parallel-07-harness"]')).toHaveAttribute(
        "data-visual-theme",
        theme,
      );
      await page.screenshot({
        fullPage: true,
        path: path.join(evidenceDir, filename),
      });
    });
  }
});
