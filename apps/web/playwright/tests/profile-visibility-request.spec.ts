// 06b-B: /profile からの公開停止/再公開申請 E2E。
// 実体テストは Phase 11 manual smoke で test.describe.skip を解除して活性化する。
// 紐付き TC: TC-E-01 / TC-E-02 / TC-E-04 / TC-E-05 / TC-E-06。
import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe.skip("profile visibility-request (06b-B)", () => {
  test("TC-E-01: public → 公開停止申請 → 202 → pending banner", async ({
    memberPage,
  }) => {
    await memberPage.route("**/api/me/visibility-request", (route) =>
      route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({
          queueId: "q1",
          type: "visibility_request",
          status: "pending",
          createdAt: new Date().toISOString(),
        }),
      }),
    );
    await memberPage.goto("/profile");
    await memberPage.getByTestId("open-hide-dialog").click();
    await memberPage.getByTestId("visibility-submit").click();
    await expect(
      memberPage.locator("[data-pending-type=visibility_request]"),
    ).toBeVisible();
    await memberPage.screenshot({ path: "visibility-pending.png" });
  });

  test("TC-E-04: 二重申請 409 → エラー banner + ボタン disabled", async ({
    memberPage,
  }) => {
    await memberPage.route("**/api/me/visibility-request", (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "DUPLICATE_PENDING_REQUEST" }),
      }),
    );
    await memberPage.goto("/profile");
    await memberPage.getByTestId("open-hide-dialog").click();
    await memberPage.getByTestId("visibility-submit").click();
    const alert = memberPage.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveAttribute("data-code", "DUPLICATE_PENDING_REQUEST");
  });

  test("TC-E-05: 422 → inline error", async ({ memberPage }) => {
    await memberPage.route("**/api/me/visibility-request", (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ error: "INVALID_REQUEST" }),
      }),
    );
    await memberPage.goto("/profile");
    await memberPage.getByTestId("open-hide-dialog").click();
    await memberPage.getByTestId("visibility-submit").click();
    await expect(
      memberPage.getByRole("alert"),
    ).toHaveAttribute("data-code", "INVALID_REQUEST");
  });

  test("TC-E-06: network failure → retry CTA", async ({ memberPage }) => {
    await memberPage.route("**/api/me/visibility-request", (route) =>
      route.abort(),
    );
    await memberPage.goto("/profile");
    await memberPage.getByTestId("open-hide-dialog").click();
    await memberPage.getByTestId("visibility-submit").click();
    await expect(memberPage.getByRole("alert")).toHaveAttribute(
      "data-code",
      "NETWORK",
    );
    await expect(memberPage.getByRole("button", { name: /再試行/ })).toBeVisible();
  });
});
