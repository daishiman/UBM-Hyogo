import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "../fixtures/auth";

const workflowRoot = join(
  process.cwd(),
  "../../docs/30-workflows/members-list-prototype-alignment",
);
const screenshotDir = join(workflowRoot, "outputs/phase-11/screenshots");
const runtimeNotesPath = join(workflowRoot, "outputs/phase-11/runtime-notes.md");

const screenshotPath = (name: string) => {
  mkdirSync(screenshotDir, { recursive: true });
  return join(screenshotDir, name);
};

test.describe("members prototype alignment", () => {
  test.setTimeout(120_000);

  test("captures required Phase 11 screenshots and verifies public selectors", async ({
    mockApi,
    page,
  }) => {
    void mockApi;
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/members", { waitUntil: "domcontentloaded" });
    // task-c: 旧 PublicHeader topbar は SidebarShell へ統合。viewer は sidebar の user-menu から /login へ到達。
    const userMenu = page.locator('[data-shell="sidebar"] [data-shell-block="user-menu"]');
    await expect(userMenu).toBeVisible();
    await userMenu.locator("summary").click();
    await expect(userMenu.locator('[data-action="login"]')).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "メンバー一覧" })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "表示密度" })).toBeVisible();
    await expect(page.getByRole("search", { name: "メンバー絞り込み" })).toBeVisible();
    await expect(page.locator('[data-component="member-filters"]')).toBeVisible();
    await expect(page.locator('[data-component="member-grid"][data-density="comfy"]')).toBeVisible();
    await page.screenshot({
      path: screenshotPath("EV-1-comfy-desktop.png"),
      fullPage: true,
    });

    await page.getByRole("radio", { name: "密" }).click();
    await expect(page).toHaveURL(/density=dense/);
    await expect(page.locator('[data-component="member-grid"][data-density="dense"]')).toBeVisible();
    await page.screenshot({
      path: screenshotPath("EV-2-dense-desktop.png"),
      fullPage: true,
    });

    await page.getByRole("radio", { name: "リスト" }).click();
    await expect(page).toHaveURL(/density=list/);
    await expect(page.locator('[data-component="member-grid"][data-density="list"]')).toBeVisible();
    await expect(page.locator('[data-role="list-head"]')).toBeVisible();
    await page.screenshot({
      path: screenshotPath("EV-3-list-desktop.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/members", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-component="member-filters"]')).toBeVisible();
    await page.screenshot({
      path: screenshotPath("EV-4-comfy-mobile.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    // 負例クエリは contracts fixture `fixtures.public.negativeQuery`（"zzz_no_match_zzz"）が正本。
    // SSR mock は CI では scripts/e2e-mock-api.mjs（q === negativeQuery 完全一致）が応答するため、
    // 独自 prefix（旧 zzznotfound-）だと空にならず EmptyState が出ない。public-top-and-list.spec.ts と同一規約。
    await page.goto("/members?q=zzz_no_match_zzz", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-component="empty-state"]')).toBeVisible();
    await page.screenshot({
      path: screenshotPath("EV-5-empty-desktop.png"),
      fullPage: true,
    });

    await page.goto("/members", { waitUntil: "domcontentloaded" });
    // task-c: login は sidebar user-menu popover 内。開いてから focus 可能。
    const sidebarMenu = page.locator('[data-shell="sidebar"] [data-shell-block="user-menu"]');
    await sidebarMenu.locator("summary").click();
    const login = sidebarMenu.locator('[data-action="login"]');
    await login.focus();
    await expect(login).toBeFocused();
    await page.screenshot({
      path: screenshotPath("EV-6-header-focus.png"),
      fullPage: true,
    });

    mkdirSync(join(workflowRoot, "outputs/phase-11"), { recursive: true });
    writeFileSync(
      runtimeNotesPath,
      [
        "# Phase 11 Runtime Notes",
        "",
        `- Captured at: ${new Date().toISOString()}`,
        "- Source: Playwright local dev server via `members-prototype-alignment.spec.ts`",
        "- Routes: `/members`, `/members?density=dense`, `/members?density=list`, `/members?q=zzz_no_match_zzz`",
        "- Result: required selectors visible and screenshots written to `outputs/phase-11/screenshots/`.",
        "",
      ].join("\n"),
    );
  });
});
