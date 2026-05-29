// workflow: admin-audit-prototype-alignment / Task B
// Regression: ensure /admin/audit mount is alive (returns 401 unauthenticated, NOT 404).
// 真因 H2（mount 順序衝突で 404）を再発検知するための回帰テスト。
// Hono の `app.route("/admin", adminAuditRoute)` 経由で `/admin/audit` が requireAdmin に
// 到達し、未認証で 401 を返すことを確認する。404 が返ったら mount 不在 = 回帰。
import { Hono } from "hono";
import { describe, it, expect } from "vitest";
import { adminAuditRoute } from "./routes/admin/audit";
import { TEST_AUTH_SECRET } from "./routes/admin/_test-auth";

describe("/admin/audit root mount regression", () => {
  it("returns 401 (not 404) when unauthenticated — mount is alive", async () => {
    const app = new Hono();
    app.route("/admin", adminAuditRoute);
    const res = await app.request(
      "/admin/audit?limit=1",
      {},
      { AUTH_SECRET: TEST_AUTH_SECRET },
    );
    // mount が活きていれば requireAdmin が 401 を返す。
    // mount 衝突 / 漏れの場合のみ Hono の notFound が 404 を返す。
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
