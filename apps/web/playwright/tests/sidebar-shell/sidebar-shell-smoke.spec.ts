// sidebar-shell-visual-baseline-smoke-task-f: smoke S1〜S6。
// auth fixture（anonymousPage=viewer / memberPage / adminPage）+ mockApi で local 完結。
import { expect, test } from "../../fixtures/auth";
import { openDrawer, toggleCollapse, waitShellReady } from "./_helpers";

// S1: viewer / desktop — PUBLIC group only + ログイン link
test("viewer sees public-only sidebar at /", async ({ anonymousPage, mockApi }) => {
  // anonymousPage は mockApi を依存しないため、public home の GET（/public/stats・/public/members）が
  // 解決できず error boundary に落ちる。mockApi を明示注入して 127.0.0.1:8787 を起動する。
  void mockApi;
  await anonymousPage.goto("/");
  await waitShellReady(anonymousPage);
  const sidebar = anonymousPage.locator('[data-testid="shell-sidebar"]');
  await expect(sidebar.getByRole("link", { name: "ログイン" })).toBeVisible();
  await expect(sidebar.getByText("MEMBERS")).toHaveCount(0);
  await expect(sidebar.getByText("ADMIN")).toHaveCount(0);
});

// S2: member / desktop — popover に プロフィール / 編集申請 / ログアウト
test("member sees 3 user actions at /profile", async ({ memberPage }) => {
  await memberPage.goto("/profile");
  await waitShellReady(memberPage);
  await memberPage.locator('[data-testid="shell-user-menu"] summary').click();
  const menu = memberPage.locator('[data-testid="shell-user-menu"]');
  await expect(menu.getByText("プロフィール", { exact: true })).toBeVisible();
  await expect(menu.getByText("プロフィール編集申請")).toBeVisible();
  await expect(menu.getByText("ログアウト")).toBeVisible();
});

// S3: admin / desktop — 13 nav items + 管理者ダッシュボード action
test("admin sees 13 nav items and admin dashboard action at /admin", async ({ adminPage }) => {
  await adminPage.goto("/admin");
  await waitShellReady(adminPage);
  const navItems = adminPage.locator('[data-testid="shell-nav"] a');
  await expect(navItems).toHaveCount(13);
  await adminPage.locator('[data-testid="shell-user-menu"] summary').click();
  await expect(
    adminPage.locator('[data-testid="shell-user-menu"]').getByText("管理者ダッシュボード"),
  ).toBeVisible();
});

// S4: viewer / mobile 375 — sidebar hidden, drawer opens on hamburger
test("mobile hides sidebar and opens drawer on hamburger", async ({ anonymousPage, mockApi }) => {
  void mockApi;
  await anonymousPage.setViewportSize({ width: 375, height: 812 });
  await anonymousPage.goto("/");
  await waitShellReady(anonymousPage);
  await expect(anonymousPage.locator('[data-testid="shell-sidebar"]')).not.toBeVisible();
  await openDrawer(anonymousPage);
  await expect(anonymousPage.locator('[data-testid="shell-drawer"]')).toBeVisible();
});

// S5: viewer / 1024 — collapse toggle + localStorage reflection
test("collapse toggle collapses sidebar and persists to localStorage", async ({
  anonymousPage,
  mockApi,
}) => {
  void mockApi;
  await anonymousPage.setViewportSize({ width: 1024, height: 800 });
  await anonymousPage.goto("/");
  await waitShellReady(anonymousPage);
  await toggleCollapse(anonymousPage);
  await expect(anonymousPage.locator('[data-testid="shell-sidebar"]')).toHaveAttribute(
    "data-collapsed",
    "true",
  );
  const persisted = await anonymousPage.evaluate(() =>
    window.localStorage.getItem("ubm:shell:collapsed"),
  );
  expect(persisted).toBeTruthy();
});

// S6: viewer / mobile 375 — drawer auto-close on route navigation
test("drawer auto-closes after navigating via a drawer link", async ({ anonymousPage, mockApi }) => {
  void mockApi;
  await anonymousPage.setViewportSize({ width: 375, height: 812 });
  await anonymousPage.goto("/");
  await waitShellReady(anonymousPage);
  await openDrawer(anonymousPage);
  await anonymousPage
    .locator('[data-testid="shell-drawer"]')
    .getByRole("link", { name: "会員ディレクトリ" })
    .click();
  await expect(anonymousPage.locator('[data-testid="shell-drawer"]')).not.toBeVisible();
});
