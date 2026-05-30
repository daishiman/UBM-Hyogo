// sidebar-shell-visual-baseline-smoke-task-f: smoke / visual 共通操作。
import type { Page } from "@playwright/test";

// shell root（app-shell）が visible になるまで待つ。
export async function waitShellReady(page: Page): Promise<void> {
  await page.locator('[data-testid="app-shell"]').waitFor({ state: "visible" });
}

// animation / transition / caret を抑止して visual を安定化する。
export async function freezeAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  });
}

// mobile drawer を hamburger 押下で開き、overlay が visible になるまで待つ。
export async function openDrawer(page: Page): Promise<void> {
  await page.locator('[data-testid="shell-drawer-toggle"]').click();
  await page.locator('[data-testid="shell-drawer"]').waitFor({ state: "visible" });
}

// collapse toggle を押して sidebar を collapsed 状態にする。
export async function toggleCollapse(page: Page): Promise<void> {
  await page.locator('[data-testid="shell-collapse-toggle"]').click();
}
