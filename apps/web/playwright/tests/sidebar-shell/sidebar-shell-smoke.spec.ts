// sidebar-shell-visual-baseline-smoke-task-f: smoke S1〜S6。
// auth fixture（anonymousPage=viewer / memberPage / adminPage）+ mockApi で local 完結。
// unified-sidebar-shell（dev landed）DOM 契約: shell root=[data-shell-root],
// sidebar=[data-shell="sidebar"], nav=[data-shell-block="nav"]/nav-item/nav-group,
// user-menu=[data-shell-block="user-menu"], drawer=[data-shell-block="drawer"]。
import { expect, test } from "../../fixtures/auth";
import { openDrawer, toggleCollapse, waitShellReady } from "./_helpers";

// S1: viewer / desktop — PUBLIC group only + ログイン link
test("viewer sees public-only sidebar at /", async ({ anonymousPage, mockApi }) => {
  // anonymousPage は mockApi を依存しないため、public home の GET（/public/stats・/public/members）が
  // 解決できず error boundary に落ちる。mockApi を明示注入して 127.0.0.1:8787 を起動する。
  void mockApi;
  await anonymousPage.goto("/");
  await waitShellReady(anonymousPage);
  const sidebar = anonymousPage.locator('[data-shell="sidebar"]');
  // viewer の login は user-menu popover（<details>）内。summary を開いてから確認する。
  await sidebar.locator('[data-shell-block="user-menu"] summary').click();
  await expect(sidebar.locator('[data-action="login"]')).toBeVisible();
  await expect(sidebar.locator('[data-shell-block="nav-group"][data-group="members"]')).toHaveCount(0);
  await expect(sidebar.locator('[data-shell-block="nav-group"][data-group="admin"]')).toHaveCount(0);
});

// S2: member / desktop — popover に プロフィール / 編集申請 / ログアウト
test("member sees 3 user actions at /profile", async ({ memberPage }) => {
  await memberPage.goto("/profile");
  await waitShellReady(memberPage);
  await memberPage.locator('[data-shell-block="user-menu"] summary').click();
  const menu = memberPage.locator('[data-shell-block="user-menu"]');
  await expect(menu.getByText("プロフィール", { exact: true })).toBeVisible();
  await expect(menu.getByText("プロフィール編集申請")).toBeVisible();
  await expect(menu.getByText("ログアウト")).toBeVisible();
});

// S3: admin / desktop — 15 nav items + 管理者ダッシュボード action
// public(3: home/directory/register) + members(1: profile) + admin(11: dashboard/attendance/
// members/tag-master/tag-queue/schema/meeting/requests/identity/audit/form-responses external link) = 15。
// tag-master(タグ管理 専用 UI・issue-1116) を admin グループへ追加したため 14→15。
test("admin sees 15 nav items and admin dashboard action at /admin", async ({ adminPage }) => {
  await adminPage.goto("/admin");
  await waitShellReady(adminPage);
  const navItems = adminPage.locator('[data-shell="sidebar"] [data-shell-block="nav-item"]');
  await expect(navItems).toHaveCount(15);
  await adminPage.locator('[data-shell-block="user-menu"] summary').click();
  await expect(
    adminPage.locator('[data-shell-block="user-menu"]').getByText("管理者ダッシュボード"),
  ).toBeVisible();
});

// S4: viewer / mobile 375 — sidebar hidden, drawer opens on hamburger
test("mobile hides sidebar and opens drawer on hamburger", async ({ anonymousPage, mockApi }) => {
  void mockApi;
  await anonymousPage.setViewportSize({ width: 375, height: 812 });
  await anonymousPage.goto("/");
  await waitShellReady(anonymousPage);
  await expect(anonymousPage.locator('[data-shell="sidebar"]')).not.toBeVisible();
  await openDrawer(anonymousPage);
  await expect(anonymousPage.locator('[data-shell-block="drawer"]')).toBeVisible();
});

// S5: viewer / 1024 — collapse toggle + cookie reflection
// issue-1024: 永続化先は localStorage から cookie(ubm_shell_collapsed) へ移行。
test("collapse toggle collapses sidebar and persists to cookie", async ({
  anonymousPage,
  mockApi,
}) => {
  void mockApi;
  await anonymousPage.setViewportSize({ width: 1024, height: 800 });
  await anonymousPage.goto("/");
  await waitShellReady(anonymousPage);
  await toggleCollapse(anonymousPage);
  await expect(anonymousPage.locator('[data-shell="sidebar"]')).toHaveAttribute(
    "data-collapsed",
    "true",
  );
  // collapse 状態は cookie(ubm_shell_collapsed=true) へ永続化される。
  const persisted = await anonymousPage.evaluate(() =>
    document.cookie
      .split("; ")
      .find((entry) => entry.startsWith("ubm_shell_collapsed=")),
  );
  expect(persisted).toBe("ubm_shell_collapsed=true");
});

// S6: viewer / mobile 375 — drawer auto-close on route navigation
test("drawer auto-closes after navigating via a drawer link", async ({ anonymousPage, mockApi }) => {
  void mockApi;
  await anonymousPage.setViewportSize({ width: 375, height: 812 });
  await anonymousPage.goto("/");
  await waitShellReady(anonymousPage);
  await openDrawer(anonymousPage);
  await anonymousPage
    .locator('[data-shell-block="drawer"]')
    .getByRole("link", { name: "会員ディレクトリ" })
    .click();
  await expect(anonymousPage.locator('[data-shell-block="drawer"]')).not.toBeVisible();
});
