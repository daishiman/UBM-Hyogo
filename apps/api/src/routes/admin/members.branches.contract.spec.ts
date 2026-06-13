// @vitest-environment node
// Branch-coverage recovery for src/routes/admin/members.ts.
// Targets uncovered validation / parse-fallback / not-found / conflict branches:
//   parseSearchOrError (filter/q/zone/sort/density/page guards, filterToSql deleted),
//   parseTagsJson / parsePendingRequestTypes / readNullableString fallbacks,
//   detail 404, attendance limit/cursor guards, photo delete 404, R2 missing 503,
//   bulk invalid json/body, tag assign/unassign not-found & deleted (409).
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminMembersRoute } from "./members";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "admin-token",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

const seedMember = async (
  env: InMemoryD1,
  memberId: string,
  answers: Record<string, unknown>,
  opts: { isDeleted?: number; publishState?: string } = {},
) => {
  const responseId = `r_${memberId}`;
  await env.db
    .prepare(
      "INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, edit_response_url, answers_json) VALUES (?1,'f1','rev1','h',?2,'2026-04-01T00:00:00Z',NULL,?3)",
    )
    .bind(responseId, `${memberId}@example.com`, JSON.stringify(answers))
    .run();
  await env.db
    .prepare(
      "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES (?1,?2,?3,?3,'2026-04-01T00:00:00Z')",
    )
    .bind(memberId, `${memberId}@example.com`, responseId)
    .run();
  await env.db
    .prepare(
      "INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted) VALUES (?1,'consented','consented',?2,?3)",
    )
    .bind(memberId, opts.publishState ?? "public", opts.isDeleted ?? 0)
    .run();
};

const seedTagDef = async (env: InMemoryD1, tagId: string, code: string) => {
  await env.db
    .prepare(
      "INSERT INTO tag_definitions (tag_id, code, label, category, active) VALUES (?1, ?2, ?2, 'general', 1)",
    )
    .bind(tagId, code)
    .run();
};

describe("admin members route — GET /members validation branches", () => {
  let env: InMemoryD1;
  let app: ReturnType<typeof createAdminMembersRoute>;
  beforeEach(async () => {
    env = await setupD1();
    app = createAdminMembersRoute();
    await seedMember(env, "m1", { fullName: "Test User" });
  }, 30000);

  it("filter=bogus → 400 invalid filter", async () => {
    const res = await app.request(
      "/members?filter=bogus",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "invalid filter" });
  });

  it("filter=deleted → 200 (filterToSql deleted 分岐)", async () => {
    await seedMember(env, "m_del", { fullName: "Deleted" }, { isDeleted: 1 });
    const res = await app.request(
      "/members?filter=deleted",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { members: Array<{ memberId: string; isDeleted: boolean }> };
    expect(body.members.some((m) => m.memberId === "m_del" && m.isDeleted)).toBe(true);
  });

  it("filter=hidden → 200 (filterToSql hidden 分岐)", async () => {
    await seedMember(env, "m_hid", { fullName: "Hidden" }, { publishState: "hidden" });
    const res = await app.request(
      "/members?filter=hidden",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
  });

  it("q が長すぎ (4倍超) → 422 q too long", async () => {
    const longQ = "a".repeat(2000);
    const res = await app.request(
      `/members?q=${longQ}`,
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "q too long" });
  });

  it("zone=bogus → 422 invalid zone", async () => {
    const res = await app.request(
      "/members?zone=bogus",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "invalid zone" });
  });

  it("sort=bogus → 422 invalid sort", async () => {
    const res = await app.request(
      "/members?sort=bogus",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "invalid sort" });
  });

  it("density=bogus → 422 invalid density", async () => {
    const res = await app.request(
      "/members?density=bogus",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "invalid density" });
  });

  it("page=0 → 422 invalid page", async () => {
    const res = await app.request(
      "/members?page=0",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "invalid page" });
  });

  it("sort=name + zone 絞り込み + tag 絞り込みで 200 (sortToSql name / zone / tag EXISTS 分岐)", async () => {
    await seedTagDef(env, "tag_a", "ALPHA");
    await env.db
      .prepare(
        "INSERT INTO member_tags (member_id, tag_id, source, assigned_at) VALUES ('m1','tag_a','manual','2026-04-01T00:00:00Z')",
      )
      .run();
    await env.db
      .prepare("UPDATE member_responses SET answers_json = ? WHERE response_id = 'r_m1'")
      .bind(JSON.stringify({ fullName: "Zoned", ubmZone: "0_to_1" }))
      .run();
    const res = await app.request(
      "/members?sort=name&zone=0_to_1&tag=ALPHA&q=Zoned",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { members: Array<{ memberId: string; tags: unknown[] }> };
    expect(body.members.some((m) => m.memberId === "m1")).toBe(true);
  });

  it("answers_json に ubmZone:null を含む member は list で 200 (readNullableString null 分岐)", async () => {
    await env.db
      .prepare("UPDATE member_responses SET answers_json = ? WHERE response_id = 'r_m1'")
      .bind(JSON.stringify({ fullName: "X", ubmZone: null, occupation: "" }))
      .run();
    const res = await app.request(
      "/members",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { members: Array<{ memberId: string; ubmZone: unknown }> };
    const m1 = body.members.find((m) => m.memberId === "m1");
    expect(m1?.ubmZone).toBeNull();
  });

  it("answers_json が壊れた JSON でも list は 200 (answers parse catch)", async () => {
    await env.db
      .prepare("UPDATE member_responses SET answers_json = ? WHERE response_id = 'r_m1'")
      .bind("{broken json")
      .run();
    const res = await app.request(
      "/members",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { members: Array<{ memberId: string; fullName: string }> };
    expect(body.members.find((m) => m.memberId === "m1")?.fullName).toBe("");
  });
});

describe("admin members route — detail / attendance / photo branches", () => {
  let env: InMemoryD1;
  let app: ReturnType<typeof createAdminMembersRoute>;
  beforeEach(async () => {
    env = await setupD1();
    app = createAdminMembersRoute();
    await seedMember(env, "m1", { fullName: "Detail User" });
  }, 30000);

  it("GET /members/:id 未知 ID → 404 not found", async () => {
    const res = await app.request(
      "/members/no_such_member",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "not found" });
  });

  it("GET /members/:id/attendance limit=0 → 400 invalid limit", async () => {
    const res = await app.request(
      "/members/m1/attendance?limit=0",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "invalid limit" });
  });

  it("GET /members/:id/attendance cursor 不正 → 400 invalid cursor", async () => {
    const res = await app.request(
      "/members/m1/attendance?cursor=%%%bad%%%",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "invalid cursor" });
  });

  it("GET /members/:id/attendance limit が上限超で clamp され 200", async () => {
    const res = await app.request(
      "/members/m1/attendance?limit=9999",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { records: unknown[]; hasMore: boolean };
    expect(Array.isArray(body.records)).toBe(true);
  });

  it("DELETE /members/:id/photo photo 不在 → 404 photo not found", async () => {
    const res = await app.request(
      "/members/m1/photo",
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "photo not found" });
  });

  it("POST /members/:id/photo member 不在 → 404 member not found", async () => {
    const fd = new FormData();
    fd.set("display", new File([new Uint8Array([1, 2, 3])], "p.jpg", { type: "image/jpeg" }));
    const res = await app.request(
      "/members/ghost/photo",
      { method: "POST", headers: { ...(await adminAuthHeader()) }, body: fd },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "member not found" });
  });

  it("POST /members/:id/photo display field 不在 → 400 file/display field required", async () => {
    const fd = new FormData();
    fd.set("other", "x");
    const res = await app.request(
      "/members/m1/photo",
      { method: "POST", headers: { ...(await adminAuthHeader()) }, body: fd },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({
      error: "file/display field required",
    });
  });

  it("POST /members/:id/photo 非対応 MIME → 415 unsupported media type", async () => {
    const fd = new FormData();
    fd.set("display", new File([new Uint8Array([1, 2, 3])], "p.txt", { type: "text/plain" }));
    const res = await app.request(
      "/members/m1/photo",
      { method: "POST", headers: { ...(await adminAuthHeader()) }, body: fd },
      makeEnv(env),
    );
    expect(res.status).toBe(415);
  });

  it("POST /members/:id/photo 空ファイル → 400 empty file", async () => {
    const fd = new FormData();
    fd.set("display", new File([new Uint8Array([])], "p.jpg", { type: "image/jpeg" }));
    const res = await app.request(
      "/members/m1/photo",
      { method: "POST", headers: { ...(await adminAuthHeader()) }, body: fd },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "empty file" });
  });

  it("POST /members/:id/photo R2 binding 無し → 503 R2 binding missing", async () => {
    // MIME/サイズ検証は通るが MEMBER_PHOTOS binding 不在で 503
    const fd = new FormData();
    fd.set("display", new File([new Uint8Array([1, 2, 3, 4])], "p.jpg", { type: "image/jpeg" }));
    const res = await app.request(
      "/members/m1/photo",
      { method: "POST", headers: { ...(await adminAuthHeader()) }, body: fd },
      makeEnv(env),
    );
    expect(res.status).toBe(503);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "R2 binding missing" });
  });
});

describe("admin members route — tag assign/unassign/bulk branches", () => {
  let env: InMemoryD1;
  let app: ReturnType<typeof createAdminMembersRoute>;
  beforeEach(async () => {
    env = await setupD1();
    app = createAdminMembersRoute();
    await seedMember(env, "m1", { fullName: "Tag User" });
    await seedTagDef(env, "tag_a", "ALPHA");
  }, 30000);

  it("POST /members/:id/tags 未知 member → 404 member_not_found", async () => {
    const res = await app.request(
      "/members/ghost/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ tagId: "tag_a" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "member_not_found" });
  });

  it("POST /members/:id/tags 削除済 member → 409 member_is_deleted", async () => {
    await seedMember(env, "m_del", { fullName: "Del" }, { isDeleted: 1 });
    const res = await app.request(
      "/members/m_del/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ tagId: "tag_a" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(409);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "member_is_deleted" });
  });

  it("POST /members/:id/tags 未知 tag → 404 tag_not_found", async () => {
    const res = await app.request(
      "/members/m1/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ tagId: "no_such_tag" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "tag_not_found" });
  });

  it("POST /members/:id/tags body 不正 JSON → 400 invalid json", async () => {
    const res = await app.request(
      "/members/m1/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: "{bad",
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "invalid json" });
  });

  it("POST /members/:id/tags tagId 欠落 body → 400 (zod)", async () => {
    const res = await app.request(
      "/members/m1/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("DELETE /members/:id/tags/:tagId 未知 member → 404 member_not_found", async () => {
    const res = await app.request(
      "/members/ghost/tags/tag_a",
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "member_not_found" });
  });

  it("DELETE /members/:id/tags/:tagId 削除済 member → 409 member_is_deleted", async () => {
    await seedMember(env, "m_del2", { fullName: "Del2" }, { isDeleted: 1 });
    const res = await app.request(
      "/members/m_del2/tags/tag_a",
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(409);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "member_is_deleted" });
  });

  it("DELETE /members/:id/tags/:tagId 未割当でも 204 (冪等・removed=false 分岐)", async () => {
    const res = await app.request(
      "/members/m1/tags/tag_a",
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(204);
  });

  it("GET /members/:id/tags 未知 member → 404 member_not_found", async () => {
    const res = await app.request(
      "/members/ghost/tags",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "member_not_found" });
  });

  it("POST /members/tags/bulk 不正 JSON → 400 invalid json", async () => {
    const res = await app.request(
      "/members/tags/bulk",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: "{bad",
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "invalid json" });
  });

  it("POST /members/tags/bulk schema 不正 → 400 invalid_body", async () => {
    const res = await app.request(
      "/members/tags/bulk",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ memberIds: [], tagIds: [], op: "assign" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({ error: "invalid_body" });
  });
});
