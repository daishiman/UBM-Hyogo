// @vitest-environment node
// 05a Phase 4: requireAdmin / requireAuth contract test (G-04〜G-08, AC-5/AC-8)
import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { signSessionJwt, asMemberId } from "@ubm-hyogo/shared";
import { requireAdmin, requireAuth } from "./require-admin";

const SECRET = "test-secret-test-secret-test-secret-test-secret";

const buildApp = () => {
  const app = new Hono<{ Bindings: { AUTH_SECRET?: string } }>();
  app.use("/auth/*", requireAuth);
  app.use("/admin/*", requireAdmin);
  app.get("/auth/me", (c) => c.json({ ok: true }));
  app.get("/admin/dashboard", (c) => c.json({ ok: true, scope: "admin" }));
  return app;
};

describe("requireAdmin / requireAuth", () => {
  it("AUTH_SECRET 未設定 → 500", async () => {
    const app = buildApp();
    const res = await app.request("/admin/dashboard", {}, { AUTH_SECRET: undefined });
    expect(res.status).toBe(500);
  });

  it("G-04 / AC-5: token なし → 401", async () => {
    const app = buildApp();
    const res = await app.request("/admin/dashboard", {}, { AUTH_SECRET: SECRET });
    expect(res.status).toBe(401);
  });

  it("G-08 / AC-8: 改ざん JWT → 401", async () => {
    const app = buildApp();
    const jwt = await signSessionJwt(SECRET, {
      memberId: asMemberId("m_001"),
      email: "u@example.com",
      isAdmin: false,
    });
    const tampered = jwt.slice(0, -3) + "AAA";
    const res = await app.request(
      "/admin/dashboard",
      { headers: { Authorization: `Bearer ${tampered}` } },
      { AUTH_SECRET: SECRET },
    );
    expect(res.status).toBe(401);
  });

  it("G-05 / AC-5: 一般 member の JWT → 403", async () => {
    const app = buildApp();
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

  it("G-06 / AC-3 / AC-5: admin の JWT → 200", async () => {
    const app = buildApp();
    const jwt = await signSessionJwt(SECRET, {
      memberId: asMemberId("m_adm"),
      email: "admin@example.com",
      isAdmin: true,
    });
    const res = await app.request(
      "/admin/dashboard",
      { headers: { Authorization: `Bearer ${jwt}` } },
      { AUTH_SECRET: SECRET },
    );
    expect(res.status).toBe(200);
  });

  it("requireAuth: 一般 member token も 200 (admin gate ではない)", async () => {
    const app = buildApp();
    const jwt = await signSessionJwt(SECRET, {
      memberId: asMemberId("m_001"),
      email: "u@example.com",
      isAdmin: false,
    });
    const res = await app.request(
      "/auth/me",
      { headers: { Authorization: `Bearer ${jwt}` } },
      { AUTH_SECRET: SECRET },
    );
    expect(res.status).toBe(200);
  });

  it("Cookie (authjs.session-token) からも JWT を読む", async () => {
    const app = buildApp();
    const jwt = await signSessionJwt(SECRET, {
      memberId: asMemberId("m_adm"),
      email: "a@example.com",
      isAdmin: true,
    });
    const res = await app.request(
      "/admin/dashboard",
      { headers: { Cookie: `authjs.session-token=${jwt}` } },
      { AUTH_SECRET: SECRET },
    );
    expect(res.status).toBe(200);
  });

  it("__Secure-authjs.session-token cookie からも読む", async () => {
    const app = buildApp();
    const jwt = await signSessionJwt(SECRET, {
      memberId: asMemberId("m_adm"),
      email: "a@example.com",
      isAdmin: true,
    });
    const res = await app.request(
      "/admin/dashboard",
      { headers: { Cookie: `__Secure-authjs.session-token=${jwt}` } },
      { AUTH_SECRET: SECRET },
    );
    expect(res.status).toBe(200);
  });
});
