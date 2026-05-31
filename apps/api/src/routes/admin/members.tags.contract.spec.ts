// @vitest-environment node
// issue-982 / task-A: admin manual member tag write endpoint の contract spec。
//   GET/POST/DELETE /admin/members/:memberId/tags の冪等性・audit・404・409・shape を検証する。
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminMembersRoute } from "./members";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

interface TagRef {
  tagId: string;
  code: string;
  label: string;
  category: string;
}
interface MemberTagsResponse {
  assigned: TagRef[];
  available: TagRef[];
}

const seedMembers = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO member_identities
       (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m1','m1@example.com','r1','r1','2026-04-01T00:00:00Z'),
              ('m_del','del@example.com','rd','rd','2026-04-01T00:00:00Z')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted)
       VALUES ('m1','consented','consented','public',0),
              ('m_del','consented','consented','hidden',1)`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
       VALUES ('tag_eng','engineer','エンジニア','occupation','[]',1),
              ('tag_mgr','manager','経営者','occupation','[]',1),
              ('tag_inact','inactive','非アクティブ','misc','[]',0)`,
    )
    .run();
};

const auditCount = async (env: InMemoryD1, action: string): Promise<number> => {
  const r = await env.db
    .prepare(
      "SELECT COUNT(*) AS n FROM audit_log WHERE target_type='member' AND target_id='m1' AND action=?1",
    )
    .bind(action)
    .first<{ n: number }>();
  return r?.n ?? 0;
};

describe("admin member tags write contract (issue-982 task-A)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seedMembers(env);
  }, 30000);

  it("A-T1: POST 新規付与 → 200 + assigned に含む + audit tag_assigned 1 件", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/m1/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ tagId: "tag_eng" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as MemberTagsResponse;
    expect(body.assigned.map((t) => t.tagId)).toContain("tag_eng");
    expect(await auditCount(env, "admin.member.tag_assigned")).toBe(1);
  });

  it("A-T2: POST 同一 tag 再送 → 200 + 重複なし + audit 増えない", async () => {
    const app = createAdminMembersRoute();
    const post = async () =>
      app.request(
        "/members/m1/tags",
        {
          method: "POST",
          headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
          body: JSON.stringify({ tagId: "tag_eng" }),
        },
        makeEnv(env),
      );
    await post();
    const res = await post();
    expect(res.status).toBe(200);
    const body = (await res.json()) as MemberTagsResponse;
    expect(body.assigned.filter((t) => t.tagId === "tag_eng")).toHaveLength(1);
    expect(await auditCount(env, "admin.member.tag_assigned")).toBe(1);
  });

  it("A-T3: POST body 不正（tagId 空）→ 400", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/m1/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ tagId: "" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("A-T4: POST tag master 不在 → 404 tag_not_found", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/m1/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ tagId: "tag_missing" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("tag_not_found");
  });

  it("A-T4b: POST inactive tag master → 404 tag_not_found（見えない tag を付与しない）", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/m1/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ tagId: "tag_inact" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("tag_not_found");
    expect(await auditCount(env, "admin.member.tag_assigned")).toBe(0);
  });

  it("A-T5: POST member 不在 → 404 member_not_found", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/nope/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ tagId: "tag_eng" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("member_not_found");
  });

  it("A-T6: POST is_deleted=1 member → 409 member_is_deleted", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/m_del/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ tagId: "tag_eng" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("member_is_deleted");
  });

  it("A-T7: DELETE 既存付与 → 204 + assigned から消える + audit tag_unassigned 1 件", async () => {
    const app = createAdminMembersRoute();
    await app.request(
      "/members/m1/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ tagId: "tag_eng" }),
      },
      makeEnv(env),
    );
    const res = await app.request(
      "/members/m1/tags/tag_eng",
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(204);
    expect(await auditCount(env, "admin.member.tag_unassigned")).toBe(1);

    const getRes = await app.request(
      "/members/m1/tags",
      { method: "GET", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    const body = (await getRes.json()) as MemberTagsResponse;
    expect(body.assigned.map((t) => t.tagId)).not.toContain("tag_eng");
  });

  it("A-T8: DELETE 未存在付与（冪等）→ 204 + audit 増えない", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/m1/tags/tag_eng",
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(204);
    expect(await auditCount(env, "admin.member.tag_unassigned")).toBe(0);
  });

  it("A-T9: DELETE is_deleted=1 member → 409 member_is_deleted", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/m_del/tags/tag_eng",
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(409);
  });

  it("A-T10: GET → 200 + { assigned, available } shape（available は active のみ）", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/m1/tags",
      { method: "GET", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as MemberTagsResponse;
    expect(Array.isArray(body.assigned)).toBe(true);
    expect(Array.isArray(body.available)).toBe(true);
    const codes = body.available.map((t) => t.code);
    expect(codes).toContain("engineer");
    expect(codes).toContain("manager");
    // active=0 の tag は available に含まれない
    expect(codes).not.toContain("inactive");
    // TagRef shape
    expect(body.available[0]).toMatchObject({
      tagId: expect.any(String),
      code: expect.any(String),
      label: expect.any(String),
      category: expect.any(String),
    });
  });

  it("A-T11: regression — GET member 不在は 404（detail GET と整合）", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/nope/tags",
      { method: "GET", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
  });

  it("authz: 401（未認証）", async () => {
    const app = createAdminMembersRoute();
    const res = await app.request(
      "/members/m1/tags",
      { method: "GET" },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });
});
