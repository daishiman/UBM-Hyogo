// 06b-B: /profile からの公開停止/再公開申請 E2E。
// 紐付き TC: TC-E-01 / TC-E-02 / TC-E-04 / TC-E-05 / TC-E-07。
import { expect } from '../fixtures/coverage';
import { test } from "../fixtures/auth";

const SCREENSHOT_DIR =
  "../../docs/30-workflows/e2e-quality-uplift-stage-1/outputs/phase-11/screenshots";

test.describe("profile visibility-request (06b-B)", () => {
  test("TC-E-01: public → 公開停止申請 → 202 → pending banner", async ({
    memberPage,
  }) => {
    await memberPage.goto("/profile");
    await memberPage.getByTestId("open-hide-dialog").click();
    await memberPage.getByTestId("visibility-submit").click();
    await expect(
      memberPage.locator("[data-pending-type=visibility_request]"),
    ).toBeVisible();
    await memberPage.screenshot({
      path: `${SCREENSHOT_DIR}/visibility-pending.png`,
    });
  });

  test("TC-E-07: pending banner survives route round-trip via server state", async ({
    memberPage,
  }) => {
    await memberPage.goto("/profile");
    await memberPage.getByTestId("open-hide-dialog").click();
    await memberPage.getByTestId("visibility-submit").click();
    await expect(
      memberPage.locator("[data-pending-type=visibility_request]"),
    ).toBeVisible();

    await memberPage.goto("/");
    await memberPage.goto("/profile");
    await expect(
      memberPage.locator("[data-pending-type=visibility_request]"),
    ).toBeVisible();
  });

  test("TC-E-04: 二重申請 409 → エラー banner + ボタン disabled", async ({
    memberPage,
    mockApi,
  }) => {
    mockApi.setVisibilityError(409, { error: "DUPLICATE_PENDING_REQUEST" });
    await memberPage.goto("/profile");
    await memberPage.getByTestId("open-hide-dialog").click();
    await memberPage.getByTestId("visibility-submit").click();
    await expect(
      memberPage.locator("[data-pending-type=visibility_request]"),
    ).toBeVisible();
    await expect(memberPage.getByTestId("open-hide-dialog")).toBeDisabled();
  });

  test("TC-E-05: reason > max disables submit", async ({ memberPage }) => {
    await memberPage.goto("/profile");
    await memberPage.getByTestId("open-hide-dialog").click();
    const submit = memberPage.getByTestId("visibility-submit");
    await memberPage.locator("textarea").evaluate((el) => {
      el.removeAttribute("maxLength");
    });
    await memberPage.locator("textarea").fill("x".repeat(501));
    await expect(submit).toBeDisabled();
  });
});
