// 06b-B follow-up #428: /profile pending banner reload sticky evidence.
// Auth fixture and seeded pending queue are runtime-gated; Phase 11 unskips this
// after a real authenticated session and admin_member_notes seed are available.
import { expect } from '../fixtures/coverage';
import { test } from "../fixtures/auth";

test.describe("profile pending banner sticky (06b-B #428)", () => {
  test("TC-01/TC-02: reload 後も visibility pending banner 表示 + ボタン disabled", async ({
    memberPage,
    mockApi,
  }) => {
    await mockApi.setVisibilityPending();
    await memberPage.goto("/profile");
    await expect(
      memberPage.locator("[data-pending-type=visibility_request]"),
    ).toBeVisible();
    await expect(memberPage.getByTestId("open-hide-dialog")).toBeDisabled();

    await memberPage.reload();

    await expect(
      memberPage.locator("[data-pending-type=visibility_request]"),
    ).toBeVisible();
    await expect(memberPage.getByTestId("open-hide-dialog")).toBeDisabled();
  });

  test("TC-05: 別経路で作成された delete pending が reload 後に反映される", async ({
    memberPage,
    mockApi,
  }) => {
    await memberPage.goto("/profile");

    // 別経路 (admin queue) で delete_request を seed
    await mockApi.setDeletePending();
    await memberPage.reload();

    await expect(
      memberPage.locator("[data-pending-type=delete_request]"),
    ).toBeVisible();
    await expect(memberPage.getByTestId("open-delete-dialog")).toBeDisabled();
  });
});
