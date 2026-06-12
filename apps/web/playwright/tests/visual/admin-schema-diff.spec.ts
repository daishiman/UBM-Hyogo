import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "../../fixtures/auth";

const evidenceDir = path.resolve(
  process.env.ADMIN_SCHEMA_DIFF_EVIDENCE_DIR ??
    path.join(
      process.cwd(),
      "../../docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots",
    ),
);

const panes = ["added", "changed", "removed", "unresolved"] as const;
// SchemaDiffPanel の pane 見出し h2 は schemaGlossary.describeDiffType の
// やさしい言い換えラベル（主・技術名併記）を正本とする（be6eac855）。
const paneHeadings = {
  added: "新しく増えた設問",
  changed: "内容が変わった設問",
  removed: "削除された設問",
  unresolved: "未対応の設問",
} as const;

const viewportSuffix = (projectName: string) =>
  projectName.includes("mobile") ? "mobile" : "desktop";

const capturedScreenshots: string[] = [];
const phase11Dir = path.basename(evidenceDir) === "screenshots"
  ? path.dirname(evidenceDir)
  : evidenceDir;

async function capture(
  page: { screenshot: (opts: { path: string; fullPage: boolean }) => Promise<Buffer> },
  name: string,
) {
  await page.screenshot({ path: path.join(evidenceDir, name), fullPage: true });
  capturedScreenshots.push(name);
}

test.afterAll(async () => {
  if (capturedScreenshots.length === 0) return;
  await mkdir(phase11Dir, { recursive: true });
  await writeFile(
    path.join(phase11Dir, "phase11-capture-metadata.json"),
    `${JSON.stringify(
      {
        taskId: "admin-schema-diff-review-resolve-ux",
        mode: "local Playwright fixture",
        status: "captured",
        capturedAt: new Date().toISOString(),
        screenshots: capturedScreenshots,
      },
      null,
      2,
    )}\n`,
  );
});

test.describe("SchemaDiffPanel runtime evidence", () => {
  test.beforeEach(async ({ adminPage }) => {
    await mkdir(evidenceDir, { recursive: true });
    await adminPage.route("**/api/admin/schema/aliases", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const body = route.request().postDataJSON() as { stableKey?: string } | null;
      const stableKey = body?.stableKey ?? "";
      if (stableKey === "member_department_invalid") {
        return route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({
            ok: false,
            error: "stableKey collision",
            code: "stable_key_collision",
            existingQuestionIds: ["serial05_step03_q_changed"],
          }),
        });
      }
      if (stableKey === "member_display_name") {
        return route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            ok: false,
            code: "stable_key_collision",
            error: "stableKey collision",
            existingStableKey: "member_display_name",
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          mode: "apply",
          confirmed: true,
          backfill: { status: "completed", remaining: 0, retryable: false },
        }),
      });
    });
  });

  test("review guide and inline assign UX canonical screenshots", async ({ adminPage }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "canonical Phase 11 evidence is desktop");
    await adminPage.goto("/admin/schema");
    await expect(adminPage.getByRole("heading", { name: "項目別の変更点" })).toBeVisible();
    await expect(
      adminPage.getByRole("heading", {
        name: "フォームの設問変更を、過去データと繋げて整理します",
      }),
    ).toBeVisible();
    await capture(adminPage, "schema-review-guide-default.png");

    const departmentButton = adminPage.getByRole("button", { name: "所属部署" });
    await expect(departmentButton).toBeVisible();
    await capture(adminPage, "schema-diff-card-collapsed.png");

    await departmentButton.click();
    await expect(departmentButton).toHaveAttribute("aria-expanded", "true");
    await expect(adminPage.locator('[data-component="schema-assign-inline-form"]')).toBeVisible();
    await expect(adminPage.locator('[data-role="assign-help"]')).toContainText(
      "過去のフォーム回答が新しい設問に自動で対応づきます",
    );
    await capture(adminPage, "schema-diff-card-inline-form-expanded.png");
    await capture(adminPage, "schema-assign-help-visible.png");
  });

  for (const pane of panes) {
    test(`pane ${pane}`, async ({ adminPage }, testInfo) => {
      await adminPage.goto("/admin/schema");
      await expect(adminPage.getByRole("heading", { name: "項目別の変更点" })).toBeVisible();
      const paneRegion = adminPage.locator(`[aria-labelledby="pane-${pane}"]`);
      await expect(adminPage.getByRole("heading", { name: paneHeadings[pane], exact: true })).toBeVisible();
      await expect(paneRegion).toBeVisible();
      const suffix = viewportSuffix(testInfo.project.name);
      await paneRegion.screenshot({
        path: path.join(evidenceDir, `admin-schema-diff-${pane}-${suffix}.png`),
      });
    });
  }

  test("resolve success feedback", async ({ adminPage }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "resolve feedback is desktop evidence");
    await adminPage.goto("/admin/schema");
    await expect(adminPage.getByRole("heading", { name: "項目別の変更点" })).toBeVisible();
    const departmentButton = adminPage.getByRole("button", { name: "所属部署" });
    await departmentButton.click();
    await expect(departmentButton).toHaveAttribute("aria-expanded", "true");
    await adminPage.getByLabel(/新しい永続的な名前/).fill("member_department_new");
    await adminPage.getByRole("button", { name: "名前を割り当てる" }).click();
    await expect(adminPage.locator('[data-feedback-kind="success"]')).toContainText(
      "項目キーを割り当てました",
    );
    await adminPage.screenshot({
      path: path.join(evidenceDir, "admin-schema-diff-resolve-success.png"),
      fullPage: true,
    });
  });

  test("resolve 409 feedback", async ({ adminPage }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "resolve feedback is desktop evidence");
    await adminPage.goto("/admin/schema");
    await expect(adminPage.getByRole("heading", { name: "項目別の変更点" })).toBeVisible();
    const displayNameButton = adminPage.getByRole("button", { name: /表示名/ });
    await displayNameButton.click();
    await expect(displayNameButton).toHaveAttribute("aria-expanded", "true");
    await adminPage.getByLabel(/新しい永続的な名前/).fill("member_display_name");
    await adminPage.getByRole("button", { name: "名前を割り当てる" }).click();
    await expect(adminPage.locator('[data-feedback-kind="conflict_error"]')).toContainText("競合");
    await adminPage.screenshot({
      path: path.join(evidenceDir, "admin-schema-diff-resolve-409.png"),
      fullPage: true,
    });
  });

  test("resolve 422 feedback", async ({ adminPage }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "resolve feedback is desktop evidence");
    await adminPage.goto("/admin/schema");
    await expect(adminPage.getByRole("heading", { name: "項目別の変更点" })).toBeVisible();
    const departmentButton = adminPage.getByRole("button", { name: "所属部署" });
    await departmentButton.click();
    await expect(departmentButton).toHaveAttribute("aria-expanded", "true");
    await adminPage.getByLabel(/新しい永続的な名前/).fill("member_department_invalid");
    await adminPage.getByRole("button", { name: "名前を割り当てる" }).click();
    await expect(adminPage.locator('[data-feedback-kind="validation_error"]')).toContainText(
      "入力内容に誤り",
    );
    await adminPage.screenshot({
      path: path.join(evidenceDir, "admin-schema-diff-resolve-422.png"),
      fullPage: true,
    });
  });
});
