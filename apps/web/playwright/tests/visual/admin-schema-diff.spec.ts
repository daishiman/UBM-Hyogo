import { mkdir } from "node:fs/promises";
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
const paneHeadings = {
  added: "追加",
  changed: "変更",
  removed: "削除",
  unresolved: "未解決",
} as const;

const viewportSuffix = (projectName: string) =>
  projectName.includes("mobile") ? "mobile" : "desktop";

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

  for (const pane of panes) {
    test(`pane ${pane}`, async ({ adminPage }, testInfo) => {
      await adminPage.goto("/admin/schema");
      await expect(adminPage.getByRole("heading", { name: "schema 差分" })).toBeVisible();
      const paneRegion = adminPage.locator(`[aria-labelledby="pane-${pane}"]`);
      await expect(adminPage.getByRole("heading", { name: paneHeadings[pane] })).toBeVisible();
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
    await adminPage.getByRole("button", { name: /所属部署/ }).click();
    await adminPage.getByLabel(/新しい stableKey/).fill("member_department_new");
    await adminPage.getByRole("button", { name: "割当" }).click();
    await expect(adminPage.getByRole("status")).toContainText("alias を割当てました");
    await adminPage.screenshot({
      path: path.join(evidenceDir, "admin-schema-diff-resolve-success.png"),
      fullPage: true,
    });
  });

  test("resolve 409 feedback", async ({ adminPage }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "resolve feedback is desktop evidence");
    await adminPage.goto("/admin/schema");
    await adminPage.getByRole("button", { name: /表示名/ }).click();
    await adminPage.getByLabel(/新しい stableKey/).fill("member_display_name");
    await adminPage.getByRole("button", { name: "割当" }).click();
    await expect(adminPage.locator('[data-feedback-kind="conflict_error"]')).toContainText("競合");
    await adminPage.screenshot({
      path: path.join(evidenceDir, "admin-schema-diff-resolve-409.png"),
      fullPage: true,
    });
  });

  test("resolve 422 feedback", async ({ adminPage }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "resolve feedback is desktop evidence");
    await adminPage.goto("/admin/schema");
    await adminPage.getByRole("button", { name: /所属部署/ }).click();
    await adminPage.getByLabel(/新しい stableKey/).fill("member_department_invalid");
    await adminPage.getByRole("button", { name: "割当" }).click();
    await expect(adminPage.locator('[data-feedback-kind="validation_error"]')).toContainText(
      "入力内容に誤り",
    );
    await adminPage.screenshot({
      path: path.join(evidenceDir, "admin-schema-diff-resolve-422.png"),
      fullPage: true,
    });
  });
});
