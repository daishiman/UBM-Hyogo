import path from "node:path";
import { expect, test } from "../../fixtures/auth";

const workflowRoot = "docs/30-workflows/ui-prototype-design-system-foundation/parallel-02-prototype-css-rules-port";
const evidenceDir =
  process.env.PLAYWRIGHT_PARALLEL02_EVIDENCE_DIR ??
  path.resolve(process.cwd(), process.cwd().endsWith("/apps/web") ? "../.." : ".", workflowRoot, "outputs/phase-11");

const evidenceCases = [
  ["tag-pill-default", "[data-evidence='tag-pill-default']"],
  ["tag-pill-selected", "[data-evidence='tag-pill-selected']"],
  ["tag-pill-hover", "[data-evidence='tag-pill-hover']"],
  ["member-card-default", "[data-evidence='member-card-default']"],
  ["member-card-hover", "[data-evidence='member-card-hover']"],
  ["member-card-focus", "[data-evidence='member-card-focus']"],
  ["visibility-public", "[data-evidence='visibility-public']"],
  ["visibility-member", "[data-evidence='visibility-member']"],
  ["visibility-admin", "[data-evidence='visibility-admin']"],
] as const;

test("parallel-02 captures G3 selector CSS evidence", async ({ page, mockApi }) => {
  void mockApi;
  await page.goto("/visual-harness/parallel-02-css-rules");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts?.ready);
  await page.addStyleTag({
    content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;}",
  });

  await page.locator("[data-evidence='tag-pill-hover']").hover({ force: true });
  await page.locator("[data-evidence='member-card-hover']").hover({ force: true });
  await page.locator("[data-evidence='member-card-focus'] a").focus();

  for (const [name, selector] of evidenceCases) {
    await expect(page.locator(selector)).toBeVisible();
    await page.locator(selector).screenshot({
      path: path.join(evidenceDir, `${name}.png`),
      animations: "disabled",
      caret: "hide",
      scale: "css",
    });
  }
});
