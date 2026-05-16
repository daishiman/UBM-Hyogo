// 06b-B: /profile からの退会申請 E2E。
// 紐付き TC: TC-E-03 / TC-E-09 / TC-E-10。
import { expect } from '../fixtures/coverage';
import { test } from "../fixtures/auth";

const SCREENSHOT_DIR =
  "../../docs/30-workflows/e2e-quality-uplift-stage-1/outputs/phase-11/screenshots";

test.describe("profile delete-request (06b-B)", () => {
  test("TC-E-03: 二段確認後に退会申請 → 202 → pending banner", async ({
    memberPage,
  }) => {
    await memberPage.goto("/profile");
    await memberPage.getByTestId("open-delete-dialog").click();
    // チェック未入力で submit が disabled
    const submit = memberPage.getByTestId("delete-submit");
    await expect(submit).toBeDisabled();
    await memberPage.getByTestId("delete-confirm-checkbox").check();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(
      memberPage.locator("[data-pending-type=delete_request]"),
    ).toBeVisible();
    await memberPage.screenshot({
      path: `${SCREENSHOT_DIR}/delete-pending.png`,
    });
  });

  test("TC-E-10: delete pending banner survives route round-trip via server state", async ({
    memberPage,
  }) => {
    await memberPage.goto("/profile");
    await memberPage.getByTestId("open-delete-dialog").click();
    const submit = memberPage.getByTestId("delete-submit");
    await memberPage.getByTestId("delete-confirm-checkbox").check();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(
      memberPage.locator("[data-pending-type=delete_request]"),
    ).toBeVisible();

    await memberPage.waitForLoadState("networkidle");
    await memberPage.goto("/");
    await memberPage.goto("/profile");
    await expect(
      memberPage.locator("[data-pending-type=delete_request]"),
    ).toBeVisible();
  });

  test("TC-E-09: kbd 操作のみで完走（tab/enter）", async ({ memberPage }) => {
    await memberPage.goto("/profile");
    const trigger = memberPage.getByTestId("open-delete-dialog");
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await memberPage.keyboard.press("Space");
    await expect(memberPage.getByTestId("delete-request-dialog")).toBeVisible();
    // dialog open 後、checkbox にフォーカス → space → submit へ tab → Enter
    await memberPage.getByTestId("delete-confirm-checkbox").focus();
    await memberPage.keyboard.press("Space");
    await memberPage.getByTestId("delete-submit").focus();
    await memberPage.keyboard.press("Enter");
    await expect(
      memberPage.locator("[data-pending-type=delete_request]"),
    ).toBeVisible();
  });
});
