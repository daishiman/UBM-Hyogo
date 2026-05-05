// 06b-B: /profile からの退会申請 E2E。
// 実体テストは Phase 11 manual smoke で test.describe.skip を解除して活性化する。
// 紐付き TC: TC-E-03 / TC-E-09。
import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe.skip("profile delete-request (06b-B)", () => {
  test("TC-E-03: 二段確認後に退会申請 → 202 → pending banner", async ({
    memberPage,
  }) => {
    await memberPage.route("**/api/me/delete-request", (route) =>
      route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({
          queueId: "q2",
          type: "delete_request",
          status: "pending",
          createdAt: new Date().toISOString(),
        }),
      }),
    );
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
    await memberPage.screenshot({ path: "delete-pending.png" });
  });

  test("TC-E-09: kbd 操作のみで完走（tab/enter）", async ({ memberPage }) => {
    await memberPage.route("**/api/me/delete-request", (route) =>
      route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({
          queueId: "q3",
          type: "delete_request",
          status: "pending",
          createdAt: new Date().toISOString(),
        }),
      }),
    );
    await memberPage.goto("/profile");
    await memberPage.getByTestId("open-delete-dialog").focus();
    await memberPage.keyboard.press("Enter");
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
