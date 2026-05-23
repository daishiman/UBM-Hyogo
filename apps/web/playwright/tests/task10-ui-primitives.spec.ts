import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures/coverage";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const evidenceDir = join(
  process.cwd(),
  "../../docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/outputs/phase-11/evidence",
);
const screenshotDir = join(evidenceDir, "screenshots");

test.describe("task-10 UI primitives runtime evidence", () => {
  test("renders 11 primitives with screenshot and axe report", async ({ page }) => {
    mkdirSync(screenshotDir, { recursive: true });

    await page.goto("/smoke/ui-primitives");
    await expect(page.getByRole("heading", { name: "Task 10 UI primitives smoke" })).toBeVisible();

    for (const text of [
      "Primary",
      "Card title",
      "Default",
      "Member name",
      "Zone",
      "公開中",
      "No pending items",
      "Invalid sample",
      "Information",
    ]) {
      await expect(page.getByText(text, { exact: false })).toBeVisible();
    }
    await expect(page.locator('aside[aria-label="Task 10 smoke sidebar"]')).toBeVisible();
    await expect(page.getByRole("img", { name: "佐藤 花子" })).toBeVisible();

    await page.screenshot({
      path: join(screenshotDir, "task10-ui-primitives-runtime.png"),
      fullPage: true,
    });

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    writeFileSync(join(evidenceDir, "axe-report.json"), `${JSON.stringify(axe, null, 2)}\n`);

    const blocking = axe.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toHaveLength(0);
  });
});
