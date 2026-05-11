import { test as base, expect, type Page } from "@playwright/test";
import { addCoverageReport } from "monocart-reporter";

export const test = base.extend<{ collectCoverage: void }>({
  collectCoverage: [
    async ({ page }: { page: Page }, use: () => Promise<void>) => {
      const shouldCollect = test.info().project.name === "desktop-chromium";

      if (shouldCollect) {
        await Promise.all([
          page.coverage.startJSCoverage({ resetOnNavigation: false }),
          page.coverage.startCSSCoverage({ resetOnNavigation: false }),
        ]);
      }

      await use();

      if (shouldCollect) {
        const [jsCoverage, cssCoverage] = await Promise.all([
          page.coverage.stopJSCoverage(),
          page.coverage.stopCSSCoverage(),
        ]);
        await addCoverageReport([...jsCoverage, ...cssCoverage], test.info());
      }
    },
    { auto: true },
  ],
});

export { expect };
export type { Page } from "@playwright/test";
