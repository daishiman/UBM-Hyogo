// 06b-B follow-up #428: /profile pending banner reload sticky evidence.
// Auth fixture and seeded pending queue are runtime-gated; Phase 11 unskips this
// after a real authenticated session and admin_member_notes seed are available.
import { expect } from "@playwright/test";
import { test } from "../fixtures/auth";

test.describe.skip("profile pending banner sticky (06b-B #428)", () => {
  test("TC-01/TC-02: reload 後も visibility pending banner 表示 + ボタン disabled", async ({
    memberPage,
  }) => {
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
  }) => {
    await memberPage.goto("/profile");

    // Phase 11 runtime seed step:
    // create admin_member_notes row:
    // note_type='delete_request', request_status='pending', member_id=current session member.
    await memberPage.reload();

    await expect(
      memberPage.locator("[data-pending-type=delete_request]"),
    ).toBeVisible();
    await expect(memberPage.getByTestId("open-delete-dialog")).toBeDisabled();
  });
});
