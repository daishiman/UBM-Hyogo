import { expect, test } from "../fixtures/coverage";
import { memberLogin } from "../fixtures/auth";

// issue-882 の責務は「/terms の RSC prefetch が env validation で 5xx / Zod throw を露出しない」こと。
// CSP report-only / nonce / stylesheet 系の console.error（origin/dev の issue-869 由来）は本テストの対象外。
// 参照: aiworkflow-requirements L-DEVSYNC-042 / task-specification-creator SP-DEVSYNC-036。
const TERMS_ENV_ERROR_PATTERNS: RegExp[] = [
  /ZodError/i,
  /Invalid environment/i,
  /env\.ts/i,
  /terms.*prefetch/i,
  /prefetch.*terms/i,
];

const isTermsEnvError = (text: string): boolean =>
  TERMS_ENV_ERROR_PATTERNS.some((pattern) => pattern.test(text));

test.beforeEach(async ({ page }) => {
  await memberLogin(page.context());
});

test("home page does not surface terms prefetch env-validation errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    if (isTermsEnvError(error.message)) {
      errors.push(`pageerror: ${error.message}`);
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (isTermsEnvError(text)) {
        errors.push(`console.error: ${text}`);
      }
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
