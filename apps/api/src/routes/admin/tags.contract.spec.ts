// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminTagsRoute } from "./tags";
import { createAdminTagsQueueRoute } from "./tags-queue";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

interface TagBody {
  tagId: string;
  code: string;
  label: string;
  category: string;
  active: boolean;
}

interface TagsListBody {
  total: number;
  items: TagBody[];
}

const seedTags = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
       VALUES ('tag_eng','engineer','エンジニア','occupation','[]',1),
              ('tag_mgr','manager','経営者','occupation','[]',1),
              ('tag_old','old','古いタグ','misc','[]',0)`,
    )
    .run();
};

const auditCount = async (env: InMemoryD1, action: string): Promise<number> => {
  const row = await env.db
    .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE target_type='tag' AND action=?1")
    .bind(action)
    .first<{ n: number }>();
  return row?.n ?? 0;
};

const latestAudit = async (
  env: InMemoryD1,
  action: string,
): Promise<{ before: string | null; after: string | null } | null> => {
  const row = await env.db
    .prepare(
      "SELECT before_json AS before, after_json AS after FROM audit_log WHERE target_type='tag' AND action=?1 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(action)
    .first<{ before: string | null; after: string | null }>();
  return row ?? null;
};

const auditPayload = async (
  env: InMemoryD1,
  action: string,
): Promise<{ before: Record<string, unknown> | null; after: Record<string, unknown> | null }> => {
  const row = await env.db
    .prepare(
      "SELECT before_json AS beforeJson, after_json AS afterJson FROM audit_log WHERE target_type='tag' AND action=?1 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(action)
    .first<{ beforeJson: string | null; afterJson: string | null }>();
  return {
    before: row?.beforeJson ? JSON.parse(row.beforeJson) as Record<string, unknown> : null,
    after: row?.afterJson ? JSON.parse(row.afterJson) as Record<string, unknown> : null,
  };
};


const appWithQueueFirst = () => {
  const app = new Hono();
  app.route("/admin", createAdminTagsQueueRoute());
  app.route("/admin", createAdminTagsRoute());
  return app;
};

describe("admin tag master CRUD contract (issue-1035)", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
    await seedTags(env);
  }, 30000);

  it("GET /admin/tags supports pagination, search, and inactive rows", async () => {
    const app = createAdminTagsRoute();
    const res = await app.request(
      "/tags?q=MAN&page=1&pageSize=10",
      { headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as TagsListBody;
    expect(body.total).toBe(1);
    expect(body.items.map((tag) => tag.code)).toEqual(["manager"]);

    const all = await app.request(
      "/tags?page=1&pageSize=10",
      { headers: await adminAuthHeader() },
      makeEnv(env),
    );
    const allBody = (await all.json()) as TagsListBody;
    expect(allBody.total).toBe(3);
    expect(allBody.items.map((tag) => tag.code)).toContain("old");
  });

  it("GET /admin/tags rejects invalid pagination query", async () => {
    const app = createAdminTagsRoute();
    const res = await app.request(
      "/tags?page=0&pageSize=101",
      { headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "invalid_query" });
  });

  it("POST /admin/tags creates a tag and maps code conflict to 409", async () => {
    const app = createAdminTagsRoute();
    const res = await app.request(
      "/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({
          code: "designer",
          label: "デザイナー",
          category: "occupation",
        }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      code: "designer",
      label: "デザイナー",
      category: "occupation",
      active: true,
    });
    expect(await auditCount(env, "admin.tag.created")).toBe(1);

    const conflict = await app.request(
      "/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({
          code: "engineer",
          label: "重複",
          category: "occupation",
        }),
      },
      makeEnv(env),
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({ ok: false, error: "tag_code_conflict" });
  });

  it("PATCH /admin/tags/:tagId updates label/category only and audits real changes", async () => {
    const app = createAdminTagsRoute();
    const res = await app.request(
      "/tags/tag_eng",
      {
        method: "PATCH",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ label: "Engineer", category: "role" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      tagId: "tag_eng",
      code: "engineer",
      label: "Engineer",
      category: "role",
    });
    expect(await auditCount(env, "admin.tag.updated")).toBe(1);

    const noop = await app.request(
      "/tags/tag_eng",
      {
        method: "PATCH",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ label: "Engineer" }),
      },
      makeEnv(env),
    );
    expect(noop.status).toBe(200);
    expect(await auditCount(env, "admin.tag.updated")).toBe(1);
  });

  it("PATCH /admin/tags/:tagId renames code and writes dedicated audit payload", async () => {
    const app = createAdminTagsRoute();
    const res = await app.request(
      "/tags/tag_eng",
      {
        method: "PATCH",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ code: "software_engineer", expectedCode: "engineer" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      tagId: "tag_eng",
      code: "software_engineer",
      label: "エンジニア",
    });
    expect(await auditCount(env, "admin.tag.code_renamed")).toBe(1);
    expect(await auditPayload(env, "admin.tag.code_renamed")).toEqual({
      before: { code: "engineer" },
      after: { code: "software_engineer" },
    });
    expect(await auditCount(env, "admin.tag.updated")).toBe(0);
  });

  it("PATCH /admin/tags/:tagId separates code conflict and stale conflicts", async () => {
    const app = createAdminTagsRoute();
    const missingExpectedCode = await app.request(
      "/tags/tag_eng",
      {
        method: "PATCH",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ code: "software_engineer" }),
      },
      makeEnv(env),
    );
    expect(missingExpectedCode.status).toBe(400);
    expect(await missingExpectedCode.json()).toEqual({ ok: false, error: "invalid_body" });

    const codeConflict = await app.request(
      "/tags/tag_eng",
      {
        method: "PATCH",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ code: "manager", expectedCode: "engineer" }),
      },
      makeEnv(env),
    );
    expect(codeConflict.status).toBe(409);
    expect(await codeConflict.json()).toEqual({ ok: false, error: "tag_code_conflict" });

    const stale = await app.request(
      "/tags/tag_eng",
      {
        method: "PATCH",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ code: "software_engineer", expectedCode: "stale_code" }),
      },
      makeEnv(env),
    );
    expect(stale.status).toBe(409);
    expect(await stale.json()).toEqual({ ok: false, error: "tag_stale_conflict" });
  });

  it("PATCH/DELETE return 404 for missing tag and PATCH rejects empty body", async () => {
    const app = createAdminTagsRoute();
    const empty = await app.request(
      "/tags/tag_eng",
      {
        method: "PATCH",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({}),
      },
      makeEnv(env),
    );
    expect(empty.status).toBe(400);
    expect(await empty.json()).toEqual({ ok: false, error: "no_update_fields" });

    const patchMissing = await app.request(
      "/tags/missing",
      {
        method: "PATCH",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ label: "x" }),
      },
      makeEnv(env),
    );
    expect(patchMissing.status).toBe(404);

    const deleteMissing = await app.request(
      "/tags/missing",
      { method: "DELETE", headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(deleteMissing.status).toBe(404);
  });

  it("DELETE /admin/tags/:tagId deactivates idempotently and keeps member_tags", async () => {
    await env.db
      .prepare(
        "INSERT INTO member_tags (member_id, tag_id, source, assigned_by) VALUES ('m1', 'tag_eng', 'manual', 'admin@example.com')",
      )
      .run();
    const app = createAdminTagsRoute();

    const first = await app.request(
      "/tags/tag_eng",
      { method: "DELETE", headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(first.status).toBe(204);
    expect(await auditCount(env, "admin.tag.deactivated")).toBe(1);

    const second = await app.request(
      "/tags/tag_eng",
      { method: "DELETE", headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(second.status).toBe(204);
    expect(await auditCount(env, "admin.tag.deactivated")).toBe(1);

    const memberTags = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE tag_id='tag_eng'")
      .first<{ n: number }>();
    expect(memberTags?.n).toBe(1);
  });

  it("POST /admin/tags/:tagId/reactivate restores inactive tags and audits only state changes", async () => {
    const app = createAdminTagsRoute();

    const first = await app.request(
      "/tags/tag_old/reactivate",
      { method: "POST", headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({
      tagId: "tag_old",
      code: "old",
      active: true,
    });
    expect(await auditCount(env, "admin.tag.reactivated")).toBe(1);
    const audit = await latestAudit(env, "admin.tag.reactivated");
    expect(audit?.before).toBe(JSON.stringify({ active: false }));
    expect(audit?.after).toBe(JSON.stringify({ active: true }));

    const second = await app.request(
      "/tags/tag_old/reactivate",
      { method: "POST", headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(second.status).toBe(200);
    expect(await auditCount(env, "admin.tag.reactivated")).toBe(1);

    const missing = await app.request(
      "/tags/missing/reactivate",
      { method: "POST", headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ ok: false, error: "tag_not_found" });
  });

  it("DELETE /admin/tags/:tagId/physical refuses references and deletes unreferenced rows", async () => {
    await env.db
      .prepare(
        "INSERT INTO member_tags (member_id, tag_id, source, assigned_by) VALUES ('m1', 'tag_eng', 'manual', 'admin@example.com')",
      )
      .run();
    const app = createAdminTagsRoute();

    const blocked = await app.request(
      "/tags/tag_eng/physical",
      { method: "DELETE", headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toEqual({
      ok: false,
      error: "tag_has_references",
      referenceCount: 1,
    });
    expect(await auditCount(env, "admin.tag.physically_deleted")).toBe(0);
    const stillThere = await env.db
      .prepare("SELECT COUNT(*) AS n FROM tag_definitions WHERE tag_id='tag_eng'")
      .first<{ n: number }>();
    expect(stillThere?.n).toBe(1);

    const deleted = await app.request(
      "/tags/tag_old/physical",
      { method: "DELETE", headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(deleted.status).toBe(204);
    expect(await auditCount(env, "admin.tag.physically_deleted")).toBe(1);
    const audit = await latestAudit(env, "admin.tag.physically_deleted");
    expect(audit?.before).toContain("\"tagId\":\"tag_old\"");
    expect(audit?.after).toBeNull();
    const gone = await env.db
      .prepare("SELECT COUNT(*) AS n FROM tag_definitions WHERE tag_id='tag_old'")
      .first<{ n: number }>();
    expect(gone?.n).toBe(0);

    const missing = await app.request(
      "/tags/missing/physical",
      { method: "DELETE", headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ ok: false, error: "tag_not_found" });
  });

  it("keeps /admin/tags/queue routed to the queue route when mounted before CRUD", async () => {
    await env.db
      .prepare(
        "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, created_at, updated_at) VALUES ('q1', 'm1', 'r1', 'queued', '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z')",
      )
      .run();
    const app = appWithQueueFirst();

    const res = await app.request(
      "/admin/tags/queue",
      { headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; items: unknown[] };
    expect(body.total).toBe(1);
    expect(body.items).toHaveLength(1);
  });
});
