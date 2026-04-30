// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminMeetingsRoute } from "./meetings";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
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
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ title: "MTG1", heldOn: "2026-04-01" }),
      },
      makeEnv(env),
    );
    expect(r1.status).toBe(201);
    const r2 = await app.request(
      "/meetings",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(r2.status).toBe(200);
    const body = (await r2.json()) as { total: number; items: Array<{ attendance: unknown[] }> };
    expect(body.total).toBe(1);
    expect(body.items[0]?.attendance).toEqual([]);
  });

  it("GET は既存 attendance を同梱する", async () => {
    const app = createAdminMeetingsRoute();
    await env.db
      .prepare("INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s1', 'MTG1', '2026-04-01', 'admin')")
      .run();
    await env.db
      .prepare(
        "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m1', 'a@example.com', 'r1', 'r1', '2026-04-01T00:00:00Z')",
      )
      .run();
    await env.db
      .prepare("INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m1', 's1', 'admin')")
      .run();

    const res = await app.request(
      "/meetings",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ sessionId: string; attendance: Array<{ memberId: string }> }>;
    };
    expect(body.items[0]?.sessionId).toBe("s1");
    expect(body.items[0]?.attendance.map((a) => a.memberId)).toEqual(["m1"]);
  });

  it("body 不正 400", async () => {
    const app = createAdminMeetingsRoute();
    const res = await app.request(
      "/meetings",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ title: "" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });
});
