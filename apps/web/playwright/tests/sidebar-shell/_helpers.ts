// sidebar-shell-visual-baseline-smoke-task-f: smoke / visual 共通操作。
// unified-sidebar-shell（dev landed）の DOM 契約: shell root=[data-shell-root="true"],
// hamburger=[data-shell-block="mobile-trigger"], drawer=[data-shell-block="drawer"],
// collapse=[data-shell-block="collapse-toggle"]。
import type { Page } from "@playwright/test";

// shell root が visible になるまで待つ。
export async function waitShellReady(page: Page): Promise<void> {
  await page.locator('[data-shell-root="true"]').waitFor({ state: "visible" });
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
  await page.locator('[data-shell-block="mobile-trigger"]').click();
  await page.locator('[data-shell-block="drawer"]').waitFor({ state: "visible" });
}

// collapse toggle を押して sidebar を collapsed 状態にする。
export async function toggleCollapse(page: Page): Promise<void> {
  await page.locator('[data-shell-block="collapse-toggle"]').click();
}
