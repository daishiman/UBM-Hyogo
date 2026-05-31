// sidebar-shell-visual-baseline-smoke-task-f: visual baseline V1〜V7。
// viewport は project（sidebar-shell-visual-{desktop,tablet,mobile}）で注入され、
// test.skip で role × viewport の 7 点だけ有効化する。baseline 正本は -linux.png。
import { expect, test } from "../../fixtures/auth";
import { freezeAnimations, openDrawer, waitShellReady } from "./_helpers";

const SHOT = { fullPage: true, maxDiffPixelRatio: 0.02 } as const;

// V1: viewer / desktop
test("viewer home desktop visual", async ({ anonymousPage, mockApi }, testInfo) => {
  test.skip(testInfo.project.name !== "sidebar-shell-visual-desktop");
  // anonymousPage は mockApi 非依存。public home GET を mock するため明示注入する。
  void mockApi;
  await anonymousPage.goto("/");
  await waitShellReady(anonymousPage);
  await freezeAnimations(anonymousPage);
  await expect(anonymousPage).toHaveScreenshot("home-1280.png", SHOT);
});

// V2: member / desktop
test("member profile desktop visual", async ({ memberPage }, testInfo) => {
  test.skip(testInfo.project.name !== "sidebar-shell-visual-desktop");
  await memberPage.goto("/profile");
  await waitShellReady(memberPage);
  await freezeAnimations(memberPage);
  await expect(memberPage).toHaveScreenshot("profile-1280.png", SHOT);
});

// V3: admin / desktop
test("admin desktop visual", async ({ adminPage }, testInfo) => {
  test.skip(testInfo.project.name !== "sidebar-shell-visual-desktop");
  await adminPage.goto("/admin");
  await waitShellReady(adminPage);
  await freezeAnimations(adminPage);
  await expect(adminPage).toHaveScreenshot("admin-1280.png", SHOT);
});

// V4: viewer / tablet
test("viewer home tablet visual", async ({ anonymousPage, mockApi }, testInfo) => {
  test.skip(testInfo.project.name !== "sidebar-shell-visual-tablet");
  void mockApi;
  await anonymousPage.goto("/");
  await waitShellReady(anonymousPage);
  await freezeAnimations(anonymousPage);
  await expect(anonymousPage).toHaveScreenshot("home-768.png", SHOT);
});

// V5: admin / tablet
test("admin tablet visual", async ({ adminPage }, testInfo) => {
  test.skip(testInfo.project.name !== "sidebar-shell-visual-tablet");
  await adminPage.goto("/admin");
  await waitShellReady(adminPage);
  await freezeAnimations(adminPage);
  await expect(adminPage).toHaveScreenshot("admin-768.png", SHOT);
});

// V6: viewer / mobile
test("viewer home mobile visual", async ({ anonymousPage, mockApi }, testInfo) => {
  test.skip(testInfo.project.name !== "sidebar-shell-visual-mobile");
  void mockApi;
  await anonymousPage.goto("/");
  await waitShellReady(anonymousPage);
  await freezeAnimations(anonymousPage);
  await expect(anonymousPage).toHaveScreenshot("home-375.png", SHOT);
});

// V7: admin / mobile（drawer open）
test("admin mobile drawer visual", async ({ adminPage }, testInfo) => {
  test.skip(testInfo.project.name !== "sidebar-shell-visual-mobile");
  await adminPage.goto("/admin");
  await waitShellReady(adminPage);
  await openDrawer(adminPage);
  await freezeAnimations(adminPage);
  await expect(adminPage).toHaveScreenshot("admin-375-drawer.png", SHOT);
});
