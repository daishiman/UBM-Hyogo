// sidebar-shell-visual-baseline-smoke-task-f: smoke S1〜S6。
// auth fixture（anonymousPage=viewer / memberPage / adminPage）+ mockApi で local 完結。
// unified-sidebar-shell（dev landed）DOM 契約: shell root=[data-shell-root],
// sidebar=[data-shell="sidebar"], nav=[data-shell-block="nav"]/nav-item/nav-group,
// user-menu=[data-shell-block="user-menu"], drawer=[data-shell-block="drawer"]。
import { expect, test } from "../../fixtures/auth";
import { openDrawer, toggleCollapse, waitShellReady } from "./_helpers";

// S1: viewer / desktop — 公開層は全ルート認証必須化（require-auth-public-access-gate）。
// 未認証で / にアクセスすると公開サイドバー shell は描画されず LoginRequiredNotice に閉じる
// （旧「guest 用 public-only サイドバー」UI は到達不能になった）。
test("viewer is gated at / and sees LoginRequiredNotice instead of the shell", async ({
  anonymousPage,
  mockApi,
}) => {
  void mockApi;
  await anonymousPage.goto("/");
  await expect(anonymousPage.locator('[data-testid="login-required-notice"]')).toBeVisible();
  await expect(anonymousPage.locator('[data-shell="sidebar"]')).toHaveCount(0);
  await expect(anonymousPage.locator('[data-testid="public-shell"]')).toHaveCount(0);
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
// public(3: home/directory/register) + members(1: profile) + admin(12: dashboard/attendance/
// members/tag-master/tag-queue/schema/meeting/requests/identity/audit/form-responses external link) = 15。
// tag-master はタグ定義管理へ統合し、tag-catalog は redirect route として nav から除外する。
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

// S4: member / mobile 375 — sidebar hidden, drawer opens on hamburger
// 認証必須化により公開ホーム shell は会員ログイン済みでのみ描画される。shell 機構
// （drawer / collapse / ナビ自動クローズ）は role 非依存のため member 文脈で検証する。
test("mobile hides sidebar and opens drawer on hamburger", async ({ memberPage }) => {
  await memberPage.setViewportSize({ width: 375, height: 812 });
  await memberPage.goto("/");
  await waitShellReady(memberPage);
  await expect(memberPage.locator('[data-shell="sidebar"]')).not.toBeVisible();
  await openDrawer(memberPage);
  await expect(memberPage.locator('[data-shell-block="drawer"]')).toBeVisible();
});

// S5: member / 1024 — collapse toggle + cookie reflection
// issue-1024: 永続化先は localStorage から cookie(ubm_shell_collapsed) へ移行。
test("collapse toggle collapses sidebar and persists to cookie", async ({
  memberPage,
}) => {
  await memberPage.setViewportSize({ width: 1024, height: 800 });
  await memberPage.goto("/");
  await waitShellReady(memberPage);
  await toggleCollapse(memberPage);
  await expect(memberPage.locator('[data-shell="sidebar"]')).toHaveAttribute(
    "data-collapsed",
    "true",
  );
  // collapse 状態は cookie(ubm_shell_collapsed=true) へ永続化される。
  const persisted = await memberPage.evaluate(() =>
    document.cookie
      .split("; ")
      .find((entry) => entry.startsWith("ubm_shell_collapsed=")),
  );
  expect(persisted).toBe("ubm_shell_collapsed=true");
});

// S6: member / mobile 375 — drawer auto-close on route navigation
test("drawer auto-closes after navigating via a drawer link", async ({ memberPage }) => {
  await memberPage.setViewportSize({ width: 375, height: 812 });
  await memberPage.goto("/");
  await waitShellReady(memberPage);
  await openDrawer(memberPage);
  await memberPage
    .locator('[data-shell-block="drawer"]')
    .getByRole("link", { name: "会員ディレクトリ" })
    .click();
  await expect(memberPage.locator('[data-shell-block="drawer"]')).not.toBeVisible();
});
