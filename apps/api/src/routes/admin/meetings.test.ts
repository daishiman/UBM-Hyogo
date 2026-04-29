// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminMeetingsRoute } from "./meetings";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
});

describe("admin meetings", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("authz: 401", async () => {
    const app = createAdminMeetingsRoute();
    const res = await app.request("/meetings", {}, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("POST + GET でラウンドトリップ", async () => {
    const app = createAdminMeetingsRoute();
    const r1 = await app.request(
      "/meetings",
      {
        method: "POST",
        headers: { Authorization: "Bearer t", "content-type": "application/json" },
        body: JSON.stringify({ title: "MTG1", heldOn: "2026-04-01" }),
      },
      makeEnv(env),
    );
    expect(r1.status).toBe(201);
    const r2 = await app.request(
      "/meetings",
      { headers: { Authorization: "Bearer t" } },
      makeEnv(env),
    );
    expect(r2.status).toBe(200);
    const body = (await r2.json()) as { total: number };
    expect(body.total).toBe(1);
  });

  it("body 不正 400", async () => {
    const app = createAdminMeetingsRoute();
    const res = await app.request(
      "/meetings",
      {
        method: "POST",
        headers: { Authorization: "Bearer t", "content-type": "application/json" },
        body: JSON.stringify({ title: "" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });
});
