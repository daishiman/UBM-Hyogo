import { expect, test } from "../fixtures/coverage";

test("home page does not surface terms prefetch env-validation errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console.error: ${message.text()}`);
    }
  });

  const failedTermsResponses: string[] = [];
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/terms") && response.status() >= 400) {
      failedTermsResponses.push(`${response.status()} ${url}`);
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "利用規約" }).hover();
  await page.waitForLoadState("networkidle");

  expect(errors, errors.join("\n")).toEqual([]);
  expect(failedTermsResponses, failedTermsResponses.join("\n")).toEqual([]);
});
