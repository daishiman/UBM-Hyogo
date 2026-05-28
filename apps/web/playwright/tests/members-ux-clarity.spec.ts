import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "../fixtures/auth";

const workflowRoot = join(
  process.cwd(),
  "../../docs/30-workflows/members-list-ux-clarity",
);
const screenshotDir = join(workflowRoot, "outputs/phase-11/screenshots");
const runtimeNotesPath = join(workflowRoot, "outputs/phase-11/runtime-notes.md");

const viewports = [
  { name: "mobile", width: 375, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "desktop", width: 1024, height: 900 },
  { name: "wide", width: 1440, height: 1000 },
] as const;

const densities = ["comfy", "dense", "list"] as const;

const screenshotPath = (name: string) => {
  mkdirSync(screenshotDir, { recursive: true });
  return join(screenshotDir, name);
};

async function expandFiltersIfCollapsed(page: import("@playwright/test").Page) {
  const summary = page.locator('[data-role="filters-summary-mobile"]');
  if ((await summary.count()) === 0) return;
  await expect(summary).toBeVisible();
  if ((await summary.getAttribute("aria-expanded")) === "false") {
    await summary.click();
    await expect(summary).toHaveAttribute("aria-expanded", "true");
  }
}

test.describe("members UX clarity visual baseline", () => {
  test.setTimeout(180_000);

  for (const viewport of viewports) {
    for (const density of densities) {
      test(`captures ${viewport.name} ${density} filtered and empty states`, async ({
        mockApi,
        page,
      }) => {
        void mockApi;
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        const densityQuery = density === "comfy" ? "" : `density=${density}`;
        const filteredQuery = [densityQuery, "tag=ai"].filter(Boolean).join("&");
        await page.goto(`/members${filteredQuery ? `?${filteredQuery}` : ""}`, {
          waitUntil: "domcontentloaded",
        });
        await expect(page.getByRole("search", { name: "メンバー絞り込み" })).toBeVisible();
        await expandFiltersIfCollapsed(page);
        await expect(page.getByRole("status")).toBeVisible();
        await page.screenshot({
          path: screenshotPath(
            `members-ux-clarity-${density}-filtered-${viewport.name}.png`,
          ),
          fullPage: true,
          mask: [page.locator('[data-role="pagination-meta"]')],
        });

        const emptyQuery = [densityQuery, "q=zzz_no_match_zzz"]
          .filter(Boolean)
          .join("&");
        await page.goto(`/members?${emptyQuery}`, {
          waitUntil: "domcontentloaded",
        });
        await expandFiltersIfCollapsed(page);
        await expect(page.locator('[data-component="empty-state"]')).toBeVisible();
        await page.screenshot({
          path: screenshotPath(
            `members-ux-clarity-${density}-empty-${viewport.name}.png`,
          ),
          fullPage: true,
          mask: [page.locator('[data-role="pagination-meta"]')],
        });
      });
    }
  }

  test.afterAll(async () => {
    mkdirSync(join(workflowRoot, "outputs/phase-11"), { recursive: true });
    writeFileSync(
      runtimeNotesPath,
      [
        "# Phase 11 Runtime Notes",
        "",
        `- Captured at: ${new Date().toISOString()}`,
        "- Source: Playwright local dev server via `members-ux-clarity.spec.ts`.",
        "- Matrix: 4 viewports x 3 density values x 2 states.",
        "- Dynamic region masked: `[data-role=\"pagination-meta\"]`.",
        "",
      ].join("\n"),
    );
  });
});
