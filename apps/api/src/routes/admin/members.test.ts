// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminMembersRoute } from "./members";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "admin-token",
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
      { headers: { Authorization: "Bearer admin-token" } },
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
      { headers: { Authorization: "Bearer admin-token" } },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
  });

  it("GET /members?filter=invalid は 400", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members?filter=bogus",
      { headers: { Authorization: "Bearer admin-token" } },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });
});
