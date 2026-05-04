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

  it("PATCH は meeting を更新し audit を追加する", async () => {
    const app = createAdminMeetingsRoute();
    await env.db
      .prepare("INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s1', 'MTG1', '2026-04-01', 'admin')")
      .run();

    const res = await app.request(
      "/meetings/s1",
      {
        method: "PATCH",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ title: "MTG2", heldOn: "2026-04-02", note: "updated" }),
      },
      makeEnv(env),
    );

    expect(res.status).toBe(200);
    const row = await env.db
      .prepare("SELECT title, held_on, note FROM meeting_sessions WHERE session_id = 's1'")
      .first<{ title: string; held_on: string; note: string }>();
    expect(row).toEqual({ title: "MTG2", held_on: "2026-04-02", note: "updated" });
    const audit = await env.db
      .prepare("SELECT action FROM audit_log WHERE target_id = 's1' ORDER BY created_at DESC LIMIT 1")
      .first<{ action: string }>();
    expect(audit?.action).toBe("meetings.update");
  });

  it("PATCH unknown は 404", async () => {
    const app = createAdminMeetingsRoute();
    const res = await app.request(
      "/meetings/missing",
      {
        method: "PATCH",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ title: "x" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
  });

  it("GET export.csv は固定列順と CSV escape で返す", async () => {
    const app = createAdminMeetingsRoute();
    await env.db
      .prepare("INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s1', 'MTG1', '2026-04-01', 'admin')")
      .run();
    await env.db
      .prepare(
        `INSERT INTO member_responses
          (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
         VALUES ('r1', 'form', 'rev', 'hash', '2026-04-01T00:00:00Z', ?)`,
      )
      .bind(JSON.stringify({ fullName: "山田, 太郎" }))
      .run();
    await env.db
      .prepare("INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m1', 'a@example.com', 'r1', 'r1', '2026-04-01T00:00:00Z')")
      .run();
    await env.db
      .prepare("INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m1', 's1', 'admin')")
      .run();

    const res = await app.request(
      "/meetings/s1/export.csv",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("meetingId,heldOn,memberId,displayName,attended");
    expect(text).toContain('s1,2026-04-01,m1,"山田, 太郎",true');
  });

  it("POST /meetings/:id/attendances は attended true/false を upsert/remove に割り当てる", async () => {
    const app = createAdminMeetingsRoute();
    await env.db
      .prepare("INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s1', 'MTG1', '2026-04-01', 'admin')")
      .run();
    await env.db
      .prepare("INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m1', 'a@example.com', 'r1', 'r1', '2026-04-01T00:00:00Z')")
      .run();

    const add = await app.request(
      "/meetings/s1/attendances",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ memberId: "m1", attended: true }),
      },
      makeEnv(env),
    );
    expect(add.status).toBe(200);
    expect(
      await env.db
        .prepare("SELECT COUNT(*) AS n FROM member_attendance WHERE member_id = 'm1' AND session_id = 's1'")
        .first<{ n: number }>(),
    ).toEqual({ n: 1 });

    const remove = await app.request(
      "/meetings/s1/attendances",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ memberId: "m1", attended: false }),
      },
      makeEnv(env),
    );
    expect(remove.status).toBe(200);
    expect(
      await env.db
        .prepare("SELECT COUNT(*) AS n FROM member_attendance WHERE member_id = 'm1' AND session_id = 's1'")
        .first<{ n: number }>(),
    ).toEqual({ n: 0 });
  });

  it("POST /meetings/:id/attendances は unknown member と soft-deleted meeting を 404 にする", async () => {
    const app = createAdminMeetingsRoute();
    await env.db
      .prepare(
        "INSERT INTO meeting_sessions (session_id, title, held_on, created_by, deleted_at) VALUES ('s1', 'MTG1', '2026-04-01', 'admin', NULL), ('s_deleted', 'MTG2', '2026-04-02', 'admin', '2026-05-04T00:00:00Z')",
      )
      .run();
    await env.db
      .prepare("INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m1', 'a@example.com', 'r1', 'r1', '2026-04-01T00:00:00Z')")
      .run();

    const unknownMember = await app.request(
      "/meetings/s1/attendances",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ memberId: "missing", attended: true }),
      },
      makeEnv(env),
    );
    expect(unknownMember.status).toBe(404);
    await expect(unknownMember.json()).resolves.toMatchObject({ error: "member_not_found" });

    const deletedMeeting = await app.request(
      "/meetings/s_deleted/attendances",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ memberId: "m1", attended: true }),
      },
      makeEnv(env),
    );
    expect(deletedMeeting.status).toBe(404);
    await expect(deletedMeeting.json()).resolves.toMatchObject({ error: "session_not_found" });
  });
});
