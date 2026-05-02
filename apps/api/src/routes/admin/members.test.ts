// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminMembersRoute } from "./members";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "admin-token",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

const seed = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      "INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, edit_response_url, answers_json) VALUES ('r1','f1','rev1','h','user@example.com','2026-04-01T00:00:00Z',NULL,?1)",
    )
    .bind(JSON.stringify({ fullName: "Test User" }))
    .run();
  await env.db
    .prepare(
      "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m1','user@example.com','r1','r1','2026-04-01T00:00:00Z')",
    )
    .run();
  await env.db
    .prepare(
      "INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted) VALUES ('m1','consented','consented','public',0)",
    )
    .run();
};

const seedMember = async (
  env: InMemoryD1,
  memberId: string,
  responseId: string,
  answers: Record<string, unknown>,
  submittedAt: string,
) => {
  await env.db
    .prepare(
      "INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, edit_response_url, answers_json) VALUES (?1,'f1','rev1','h',?2,?3,NULL,?4)",
    )
    .bind(
      responseId,
      `${memberId}@example.com`,
      submittedAt,
      JSON.stringify(answers),
    )
    .run();
  await env.db
    .prepare(
      "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES (?1,?2,?3,?3,?4)",
    )
    .bind(memberId, `${memberId}@example.com`, responseId, submittedAt)
    .run();
  await env.db
    .prepare(
      "INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted) VALUES (?1,'consented','consented','public',0)",
    )
    .bind(memberId)
    .run();
};

describe("admin members route", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seed(env);
  }, 30000);

  it("authz: 未認証 401", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request("/members", {}, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("GET /members: list を返す", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; members: unknown[] };
    expect(body.total).toBe(1);
    expect(body.members.length).toBe(1);
  });

  it("GET /members/:memberId 未存在は 404", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/m_unknown",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
  });

  it("GET /members/:memberId の audit は audit_log 由来で admin_member_notes を混ぜない", async () => {
    await env.db
      .prepare(
        `INSERT INTO admin_member_notes
         (note_id, member_id, body, created_by, updated_by, created_at, updated_at)
         VALUES ('note_admin_only', 'm1', 'admin note body', 'owner@example.com', 'owner@example.com', '2026-04-01T00:00:00Z', '2026-04-01T00:00:00Z')`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO audit_log
         (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at)
         VALUES ('audit_1', NULL, 'owner@example.com', 'member.status_updated', 'member', 'm1', NULL, NULL, '2026-04-02T00:00:00Z')`,
      )
      .run();

    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/m1",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      audit: Array<{ action: string; note: string | null }>;
    };
    expect(body.audit).toEqual([
      {
        actor: "owner@example.com",
        action: "member.status_updated",
        occurredAt: "2026-04-02T00:00:00Z",
        note: null,
      },
    ]);
    expect(JSON.stringify(body.audit)).not.toContain("admin note body");
  });

  it("GET /members?filter=invalid は 400", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?filter=bogus",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("GET /members?sort=invalid は 422", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?sort=relevance",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
  });

  it("GET /members?density=invalid は 422", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?density=cozy",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
  });

  it("GET /members?zone=invalid は 422", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?zone=outer",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
  });

  it("GET /members?q=<201 chars> は 422", async () => {
    const app = createAdminMembersRoute();
    const longQ = "a".repeat(201);
    const res = await app.request(
      `/members?q=${longQ}`,
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
  });

  it("GET /members?q=Test は fullName で hit", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?q=Test",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; members: Array<{ memberId: string }>; page?: number; pageSize?: number };
    expect(body.total).toBe(1);
    expect(body.members[0]?.memberId).toBe("m1");
    expect(body.page).toBe(1);
    expect(body.pageSize).toBeGreaterThan(0);
  });

  it("GET /members?q=NoMatch は 0 件", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?q=NoMatch",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; members: unknown[] };
    expect(body.total).toBe(0);
    expect(body.members).toEqual([]);
  });

  it("GET /members?page=99999 は 200 + 空配列", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?page=99999",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; members: unknown[] };
    expect(body.members).toEqual([]);
  });

  it("GET /members?page=0 は 422", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?page=0",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
  });

  it("GET /members?tag が 6 件以上なら 422", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?tag=a&tag=b&tag=c&tag=d&tag=e&tag=f",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
  });

  it("GET /members?tag=code-a&tag=code-b は tag code AND で hit", async () => {
    await env.db
      .prepare(
        "INSERT INTO tag_definitions (tag_id, code, label, category) VALUES ('tag_a','code-a','Code A','interest'), ('tag_b','code-b','Code B','interest')",
      )
      .run();
    await env.db
      .prepare(
        "INSERT INTO member_tags (member_id, tag_id, source) VALUES ('m1','tag_a','manual'), ('m1','tag_b','manual')",
      )
      .run();
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?tag=code-a&tag=code-b",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; members: Array<{ memberId: string }> };
    expect(body.total).toBe(1);
    expect(body.members[0]?.memberId).toBe("m1");
  });

  it("GET /members?zone=1_to_10 は ubmZone で絞り込む", async () => {
    await seedMember(env, "m2", "r2", { fullName: "Other", ubmZone: "0_to_1" }, "2026-04-02T00:00:00Z");
    await env.db
      .prepare("UPDATE member_responses SET answers_json = ? WHERE response_id = 'r1'")
      .bind(JSON.stringify({ fullName: "Test User", ubmZone: "1_to_10" }))
      .run();
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?zone=1_to_10",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; members: Array<{ memberId: string }> };
    expect(body.total).toBe(1);
    expect(body.members[0]?.memberId).toBe("m1");
  });

  it("GET /members?sort=name は fullName 昇順で返す", async () => {
    await seedMember(env, "m2", "r2", { fullName: "Alice" }, "2026-04-02T00:00:00Z");
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?sort=name",
      { headers: { ...await adminAuthHeader() } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { members: Array<{ memberId: string }> };
    expect(body.members.map((m) => m.memberId)).toEqual(["m2", "m1"]);
  });
});
