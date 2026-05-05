// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminMemberNotesRoute } from "./member-notes";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

describe("admin member notes", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await env.db
      .prepare(
        `INSERT INTO member_identities
         (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
         VALUES ('m1','m1@example.com','r1','r1','2026-04-01T00:00:00Z'),
                ('m2','m2@example.com','r2','r2','2026-04-01T00:00:00Z')`,
      )
      .run();
  }, 30000);

  it("authz: 401", async () => {
    const app = createAdminMemberNotesRoute();
    const res = await app.request(
      "/members/m1/notes",
      { method: "POST", body: JSON.stringify({ body: "x" }) },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });

  it("POST: 201 + 作成された note を返す", async () => {
    const app = createAdminMemberNotesRoute();
    const res = await app.request(
      "/members/m1/notes",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ body: "test memo" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; note: { noteId: string } };
    expect(body.ok).toBe(true);
    expect(body.note.noteId).toBeTruthy();
    const audit = await env.db
      .prepare(
        "SELECT action, target_id FROM audit_log WHERE target_type='member' AND target_id='m1'",
      )
      .all<{ action: string; target_id: string }>();
    expect(audit.results).toEqual([
      { action: "admin.member.note_created", target_id: "m1" },
    ]);
  });

  it("body 空は 400", async () => {
    const app = createAdminMemberNotesRoute();
    const res = await app.request(
      "/members/m1/notes",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ body: "" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("PATCH: 別 member の note は 404", async () => {
    const app = createAdminMemberNotesRoute();
    const created = await app.request(
      "/members/m1/notes",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ body: "test memo" }),
      },
      makeEnv(env),
    );
    const body = (await created.json()) as { note: { noteId: string } };
    const res = await app.request(
      `/members/m2/notes/${body.note.noteId}`,
      {
        method: "PATCH",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ body: "bad update" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
  });

  it("PATCH: 200 + note 更新 + audit 追加", async () => {
    const app = createAdminMemberNotesRoute();
    const created = await app.request(
      "/members/m1/notes",
      {
        method: "POST",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ body: "before memo" }),
      },
      makeEnv(env),
    );
    const createdBody = (await created.json()) as { note: { noteId: string } };

    const res = await app.request(
      `/members/m1/notes/${createdBody.note.noteId}`,
      {
        method: "PATCH",
        headers: { ...await adminAuthHeader(), "content-type": "application/json" },
        body: JSON.stringify({ body: "after memo" }),
      },
      makeEnv(env),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      note: { noteId: string; body: string };
    };
    expect(body).toMatchObject({
      ok: true,
      note: { noteId: createdBody.note.noteId, body: "after memo" },
    });

    const audit = await env.db
      .prepare(
        "SELECT action, before_json AS beforeJson, after_json AS afterJson FROM audit_log WHERE target_type='member' AND target_id='m1' ORDER BY created_at ASC",
      )
      .all<{ action: string; beforeJson: string | null; afterJson: string | null }>();
    expect(audit.results?.map((row) => row.action)).toEqual([
      "admin.member.note_created",
      "admin.member.note_updated",
    ]);
    expect(JSON.parse(audit.results?.[1]?.beforeJson ?? "{}")).toEqual({
      body: "before memo",
    });
    expect(JSON.parse(audit.results?.[1]?.afterJson ?? "{}")).toEqual({
      body: "after memo",
    });
  });
});
