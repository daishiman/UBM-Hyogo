import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "../../fixtures/auth";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const EVIDENCE_ROOT = path.resolve(
  process.cwd(),
  "../../docs/30-workflows/parallel-03-prototype-ux-css/outputs/phase-11",
);
const SCREENSHOT_DIR = path.join(EVIDENCE_ROOT, "screenshots");

async function screenshot(page: Page, name: string) {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  });
}

async function assertNoCriticalAxe(page: Page) {
  const result = await new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const critical = result.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
}

async function cssVar(page: Page, name: string) {
  return page.evaluate(
    (token) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${token})`;
      document.body.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    },
    name,
  );
}

test.describe("parallel-03 prototype visual feedback", () => {
  test("G3-1 selected tag pill uses filled token colors", async ({ page, mockApi }) => {
    void mockApi;
    await page.goto("/members?tag=kobe");
    const selected = page.getByRole("button", { name: "#kobe ×" });
    await expect(selected).toHaveAttribute("data-component", "tag-pill");
    await expect(selected).toHaveAttribute("data-selected", "true");
    await expect(selected).toHaveAttribute("aria-pressed", "true");
    await expect(selected).not.toHaveAttribute("aria-selected", /.+/);

    const expectedBg = await cssVar(page, "--ubm-color-text-primary");
    const actualBg = await selected.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    expect(actualBg).toBe(expectedBg);
    await screenshot(page, "tag-pill-selected");
    await assertNoCriticalAxe(page);
  });

  test("G3-1 unselected filter state has no active tag pill", async ({ page, mockApi }) => {
    void mockApi;
    await page.goto("/members");
    await expect(page.locator('button[data-component="tag-pill"]')).toHaveCount(0);
    await screenshot(page, "tag-pill-default");
  });

  test("G3-2 member card hover and focus-within change visual state", async ({ page, mockApi }) => {
    void mockApi;
    await page.goto("/members");
    const card = page.locator('[data-component="member-card"]').first();
    await expect(card).toBeVisible();
    const before = await card.evaluate((node) => {
      const style = getComputedStyle(node);
      return { borderColor: style.borderColor, boxShadow: style.boxShadow };
    });

    await card.hover();
    await expect
      .poll(async () =>
        card.evaluate((node) => getComputedStyle(node).boxShadow),
      )
      .not.toBe(before.boxShadow);
    const afterHover = await card.evaluate((node) => {
      const style = getComputedStyle(node);
      return { borderColor: style.borderColor, boxShadow: style.boxShadow };
    });
    expect(afterHover.borderColor).not.toBe(before.borderColor);
    await screenshot(page, "member-card-hover");

    await card.getByRole("link").focus();
    await expect
      .poll(async () =>
        card.evaluate((node) => getComputedStyle(node).outlineStyle),
      )
      .toBe("solid");
    await screenshot(page, "member-card-focus");
  });

  test("G3-3 profile section visibility markers use token colors", async ({ page, mockApi }) => {
    void mockApi;
    await page.goto("/members/sample-001");
    const section = page.locator('[data-component="profile-section"]').first();
    await expect(section).toHaveAttribute("data-visibility", "public");
    const publicColor = await cssVar(page, "--ubm-color-ok");
    await expect(section).toHaveCSS("border-left-color", publicColor);
    await screenshot(page, "profile-section-public");

    await section.evaluate((node) => node.setAttribute("data-visibility", "member"));
    const memberColor = await cssVar(page, "--ubm-color-zone-b");
    await expect(section).toHaveCSS("border-left-color", memberColor);
    await screenshot(page, "profile-section-member");

    await section.evaluate((node) => node.setAttribute("data-visibility", "admin"));
    const adminColor = await cssVar(page, "--ubm-color-danger");
    await expect(section).toHaveCSS("border-left-color", adminColor);
    await screenshot(page, "profile-section-admin");
  });

  test("G3-3 form preview visibility labels are differentiated", async ({ page, mockApi }) => {
    void mockApi;
    await page.goto("/register");
    const labels = page.locator('[data-role="visibility"][data-visibility]');
    await expect(labels.first()).toBeVisible();
    await expect(labels.filter({ hasText: "公開" }).first()).toHaveCSS(
      "color",
      await cssVar(page, "--ubm-color-ok"),
    );
    await expect(labels.filter({ hasText: "会員のみ" }).first()).toHaveCSS(
      "color",
      await cssVar(page, "--ubm-color-zone-b"),
    );
    await expect(labels.filter({ hasText: "管理者のみ" }).first()).toHaveCSS(
      "color",
      await cssVar(page, "--ubm-color-danger"),
    );
  });
});
