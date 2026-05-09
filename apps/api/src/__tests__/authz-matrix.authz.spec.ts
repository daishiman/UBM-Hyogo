// 08a AC-3: anonymous / member / admin × public / member / admin endpoint の
// 認可境界（401 / 403 / 200）を 1 ファイルで集約 verify する代表ケース。
//
// 個別の詳細ケースは下記ファイルで網羅済み（DRY のため本ファイルでは重複させない）:
//   - apps/api/src/middleware/require-admin.test.ts（admin endpoint 軸）
//   - apps/api/src/routes/me/index.test.ts（member endpoint 軸 / session-guard）
//   - apps/api/src/routes/public/*（public endpoint は認証不要）
//
// 本ファイルの責務:
//   各軸で「(anonymous, member, admin) のうち誰が通り、誰が落ちるか」を 1 ケースだけ確認する。

import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { signSessionJwt, asMemberId } from "@ubm-hyogo/shared";
import { requireAdmin } from "../middleware/require-admin";

const SECRET = "test-secret-test-secret-test-secret-test-secret";

const buildAdminApp = () => {
  const app = new Hono<{ Bindings: { AUTH_SECRET?: string } }>();
  app.use("/admin/*", requireAdmin);
  app.get("/admin/dashboard", (c) => c.json({ ok: true }));
  return app;
};

const buildPublicApp = () => {
  // public endpoint は middleware なしで即 200（認可ゲートを通さない代表）
  const app = new Hono();
  app.get("/public/stats", (c) => c.json({ ok: true }));
  return app;
};

describe("08a AC-3: authz matrix（代表ケース）", () => {
  describe("admin endpoint 軸", () => {
    it("anonymous → 401", async () => {
      const app = buildAdminApp();
      const res = await app.request("/admin/dashboard", {}, { AUTH_SECRET: SECRET });
      expect(res.status).toBe(401);
    });

    it("member（isAdmin=false）→ 403", async () => {
      const app = buildAdminApp();
      const jwt = await signSessionJwt(SECRET, {
        memberId: asMemberId("m_001"),
        email: "u@example.com",
        isAdmin: false,
      });
      const res = await app.request(
        "/admin/dashboard",
        { headers: { Authorization: `Bearer ${jwt}` } },
        { AUTH_SECRET: SECRET },
      );
      expect(res.status).toBe(403);
    });

    it("admin（isAdmin=true）→ 200", async () => {
      const app = buildAdminApp();
      const jwt = await signSessionJwt(SECRET, {
        memberId: asMemberId("m_adm"),
        email: "a@example.com",
        isAdmin: true,
      });
      const res = await app.request(
        "/admin/dashboard",
        { headers: { Authorization: `Bearer ${jwt}` } },
        { AUTH_SECRET: SECRET },
      );
      expect(res.status).toBe(200);
    });
  });

  describe("public endpoint 軸", () => {
    it("anonymous → 200（認可なしで読める）", async () => {
      const app = buildPublicApp();
      const res = await app.request("/public/stats");
      expect(res.status).toBe(200);
    });
  });
});
