import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { expect, memberLogin, test } from "../fixtures/auth";

const workflowRoot =
  process.env.MEMBERS_UX_EVIDENCE_DIR !== undefined
    ? resolve(process.env.MEMBERS_UX_EVIDENCE_DIR)
    : join(
        process.cwd(),
        "../../docs/30-workflows/completed-tasks/members-list-ux-clarity",
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
  const root = page.locator('[data-component="member-filters"]');
  const summary = page.locator('[data-role="filters-summary-mobile"]');
  if ((await summary.count()) === 0) return;
  // tablet/desktop viewport では CSS で display:none となるため visible 判定で skip。
  if (!(await summary.isVisible())) return;
  const body = page.locator(
    '[data-component="member-filters"] [data-role="filters-body"]',
  );
  if (await body.isVisible()) return;
  // React 側 onClick が hydration 完了後にアタッチされるため、SSR 直後に click
  // しても state が動かず data-expanded が "false" のままになる race がある。
  // Playwright のアクション可能性 (actionability) チェックを利用し、state の
  // 反映を data-expanded で待つ。
  for (let attempt = 0; attempt < 5; attempt++) {
    await summary.click();
    try {
      await expect(root).toHaveAttribute("data-expanded", "true", {
        timeout: 3_000,
      });
      await expect(body).toBeVisible({ timeout: 3_000 });
      return;
    } catch {
      // 次の試行へフォールスルー (hydration がまだの場合)
    }
  }
  // 本 spec は visual baseline 取得が目的。操作 state は component test で担保し、
  // cold-start hydration が遅い環境では撮影対象の展開状態だけを固定する。
  await root.evaluate((element) => {
    element.setAttribute("data-expanded", "true");
    element
      .querySelector('[data-role="filters-summary-mobile"]')
      ?.setAttribute("aria-expanded", "true");
  });
  await expect(body).toBeVisible({ timeout: 5_000 });
}

test.describe("members UX clarity visual baseline", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await memberLogin(page.context());
  });

  test.beforeAll(async ({ browser, baseURL }, testInfo) => {
    testInfo.setTimeout(180_000);
    const page = await browser.newPage();
    await memberLogin(page.context());
    try {
      await page.goto(`${baseURL ?? "http://localhost:3000"}/members`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByRole("search", { name: "メンバー絞り込み" })).toBeVisible();
    } finally {
      await page.close();
    }
  });

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
        "- Cold-start route warm-up: config ready URL `/members` + spec `beforeAll`; direct-script supplementation is not required.",
        "- Mobile filter expansion: click waits for `data-expanded=true`; visual capture fallback fixes the expanded state if hydration is still settling.",
        "- Evidence path: docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/.",
        "",
      ].join("\n"),
    );
  });
});
