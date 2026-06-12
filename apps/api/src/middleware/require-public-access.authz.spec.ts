// @vitest-environment node
import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { asMemberId, signSessionJwt } from "@ubm-hyogo/shared";

import { requirePublicAccess } from "./require-public-access";

const SECRET = "test-secret-test-secret-test-secret-test-secret";
const INTERNAL = "internal-secret";

const buildApp = () => {
  const app = new Hono<{
    Bindings: { AUTH_SECRET?: string; INTERNAL_AUTH_SECRET?: string };
  }>();
  app.use("/public/*", requirePublicAccess);
  app.get("/public/members", (c) => c.json({ ok: true }));
  return app;
};

describe("requirePublicAccess", () => {
  it("認証情報なしは 401", async () => {
    const res = await buildApp().request(
      "/public/members",
      {},
      { AUTH_SECRET: SECRET, INTERNAL_AUTH_SECRET: INTERNAL },
    );
    expect(res.status).toBe(401);
  });

  it("有効な member session bearer は 200", async () => {
    const jwt = await signSessionJwt(SECRET, {
      memberId: asMemberId("m-001"),
      email: "member@example.com",
      isAdmin: false,
    });
    const res = await buildApp().request(
      "/public/members",
      { headers: { Authorization: `Bearer ${jwt}` } },
      { AUTH_SECRET: SECRET, INTERNAL_AUTH_SECRET: INTERNAL },
    );
    expect(res.status).toBe(200);
  });

  it("authjs.session-token cookie も session として通す", async () => {
    const jwt = await signSessionJwt(SECRET, {
      memberId: asMemberId("m-002"),
      email: "member2@example.com",
      isAdmin: false,
    });
    const res = await buildApp().request(
      "/public/members",
      { headers: { Cookie: `authjs.session-token=${encodeURIComponent(jwt)}` } },
      { AUTH_SECRET: SECRET, INTERNAL_AUTH_SECRET: INTERNAL },
    );
    expect(res.status).toBe(200);
  });

  it("X-Internal-Auth が一致すれば session 無しでも 200", async () => {
    const res = await buildApp().request(
      "/public/members",
      { headers: { "X-Internal-Auth": INTERNAL } },
      { AUTH_SECRET: SECRET, INTERNAL_AUTH_SECRET: INTERNAL },
    );
    expect(res.status).toBe(200);
  });

  it("壊れた session でも内部認証が一致すれば OR 判定で 200", async () => {
    const res = await buildApp().request(
      "/public/members",
      {
        headers: {
          Authorization: "Bearer broken",
          "X-Internal-Auth": INTERNAL,
        },
      },
      { AUTH_SECRET: SECRET, INTERNAL_AUTH_SECRET: INTERNAL },
    );
    expect(res.status).toBe(200);
  });

  it("AUTH_SECRET / INTERNAL_AUTH_SECRET が未設定なら fail-closed で 401", async () => {
    const res = await buildApp().request(
      "/public/members",
      { headers: { "X-Internal-Auth": INTERNAL } },
      {},
    );
    expect(res.status).toBe(401);
  });
});
