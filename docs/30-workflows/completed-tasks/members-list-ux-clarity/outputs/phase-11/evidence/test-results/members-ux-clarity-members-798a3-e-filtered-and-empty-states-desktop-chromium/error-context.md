# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: members-ux-clarity.spec.ts >> members UX clarity visual baseline >> captures tablet dense filtered and empty states
- Location: playwright/tests/members-ux-clarity.spec.ts:40:7

# Error details

```
Error: Channel closed
```

```
Error: locator.click: Test ended.
Call log:
  - waiting for locator('[data-role="filters-summary-mobile"]')
    - locator resolved to <button type="button" aria-expanded="false" data-role="filters-summary-mobile" data-component="filters-summary-mobile">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    11 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms

```

# Test source

```ts
  1   | import { mkdirSync, writeFileSync } from "node:fs";
  2   | import { join } from "node:path";
  3   | 
  4   | import { expect, test } from "../fixtures/auth";
  5   | 
  6   | const workflowRoot = join(
  7   |   process.cwd(),
  8   |   "../../docs/30-workflows/completed-tasks/members-list-ux-clarity",
  9   | );
  10  | const screenshotDir = join(workflowRoot, "outputs/phase-11/screenshots");
  11  | const runtimeNotesPath = join(workflowRoot, "outputs/phase-11/runtime-notes.md");
  12  | 
  13  | const viewports = [
  14  |   { name: "mobile", width: 375, height: 800 },
  15  |   { name: "tablet", width: 768, height: 900 },
  16  |   { name: "desktop", width: 1024, height: 900 },
  17  |   { name: "wide", width: 1440, height: 1000 },
  18  | ] as const;
  19  | 
  20  | const densities = ["comfy", "dense", "list"] as const;
  21  | 
  22  | const screenshotPath = (name: string) => {
  23  |   mkdirSync(screenshotDir, { recursive: true });
  24  |   return join(screenshotDir, name);
  25  | };
  26  | 
  27  | async function expandFiltersIfCollapsed(page: import("@playwright/test").Page) {
  28  |   const summary = page.locator('[data-role="filters-summary-mobile"]');
  29  |   if ((await summary.count()) === 0) return;
  30  |   if ((await summary.getAttribute("aria-expanded")) === "false") {
> 31  |     await summary.click();
      |                   ^ Error: locator.click: Test ended.
  32  |   }
  33  | }
  34  | 
  35  | test.describe("members UX clarity visual baseline", () => {
  36  |   test.setTimeout(180_000);
  37  | 
  38  |   for (const viewport of viewports) {
  39  |     for (const density of densities) {
  40  |       test(`captures ${viewport.name} ${density} filtered and empty states`, async ({
  41  |         mockApi,
  42  |         page,
  43  |       }) => {
  44  |         void mockApi;
  45  |         await page.setViewportSize({
  46  |           width: viewport.width,
  47  |           height: viewport.height,
  48  |         });
  49  | 
  50  |         const densityQuery = density === "comfy" ? "" : `density=${density}`;
  51  |         const filteredQuery = [densityQuery, "tag=ai"].filter(Boolean).join("&");
  52  |         await page.goto(`/members${filteredQuery ? `?${filteredQuery}` : ""}`, {
  53  |           waitUntil: "domcontentloaded",
  54  |         });
  55  |         await expect(page.getByRole("search", { name: "メンバー絞り込み" })).toBeVisible();
  56  |         await expandFiltersIfCollapsed(page);
  57  |         await expect(page.getByRole("status")).toBeVisible();
  58  |         await page.screenshot({
  59  |           path: screenshotPath(
  60  |             `members-ux-clarity-${density}-filtered-${viewport.name}.png`,
  61  |           ),
  62  |           fullPage: true,
  63  |           mask: [page.locator('[data-role="pagination-meta"]')],
  64  |         });
  65  | 
  66  |         const emptyQuery = [densityQuery, "q=zzz_no_match_zzz"]
  67  |           .filter(Boolean)
  68  |           .join("&");
  69  |         await page.goto(`/members?${emptyQuery}`, {
  70  |           waitUntil: "domcontentloaded",
  71  |         });
  72  |         await expandFiltersIfCollapsed(page);
  73  |         await expect(page.locator('[data-component="empty-state"]')).toBeVisible();
  74  |         await page.screenshot({
  75  |           path: screenshotPath(
  76  |             `members-ux-clarity-${density}-empty-${viewport.name}.png`,
  77  |           ),
  78  |           fullPage: true,
  79  |           mask: [page.locator('[data-role="pagination-meta"]')],
  80  |         });
  81  |       });
  82  |     }
  83  |   }
  84  | 
  85  |   test.afterAll(async () => {
  86  |     mkdirSync(join(workflowRoot, "outputs/phase-11"), { recursive: true });
  87  |     writeFileSync(
  88  |       runtimeNotesPath,
  89  |       [
  90  |         "# Phase 11 Runtime Notes",
  91  |         "",
  92  |         `- Captured at: ${new Date().toISOString()}`,
  93  |         "- Source: Playwright local dev server via `members-ux-clarity.spec.ts`.",
  94  |         "- Matrix: 4 viewports x 3 density values x 2 states.",
  95  |         "- Dynamic region masked: `[data-role=\"pagination-meta\"]`.",
  96  |         "",
  97  |       ].join("\n"),
  98  |     );
  99  |   });
  100 | });
  101 | 
```