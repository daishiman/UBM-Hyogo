// @vitest-environment node
import { Hono } from "hono";
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminAuditRoute, encodeAuditCursor } from "./audit";
import { createAdminMembersRoute } from "./members";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

const seedAudit = async (env: InMemoryD1) => {
  const rows: Array<[
    string,
    string,
    string,
    string,
    string,
    string | null,
    string | null,
    string,
  ]> = [
    [
      "audit_001",
      "owner@example.com",
      "attendance.add",
      "meeting",
      "s1",
      null,
      JSON.stringify({
        responseEmail: "person@example.com",
        phone: "090-1111-2222",
        nested: {
          fullName: "Person One",
          displayName: "Display One",
          mobile: "090-3333-4444",
          postalCode: "650-0000",
          note: "visible",
        },
      }),
      "2026-04-30T14:59:00.000Z",
    ],
    [
      "audit_002",
      "owner@example.com",
      "attendance.remove",
      "meeting",
      "s1",
      JSON.stringify({ address: "Hyogo" }),
      null,
      "2026-04-30T15:00:00.000Z",
    ],
    [
      "audit_004",
      "owner@example.com",
      "admin.request.approve",
      "admin_member_note",
      "note_1",
      null,
      JSON.stringify({ noteId: "note_1", memberId: "m1", resolution: "approve" }),
      "2026-04-29T16:00:00.000Z",
    ],
    [
      "audit_005",
      "admin@example.com",
      "identity.dismiss",
      "member",
      "m_target",
      JSON.stringify({ sourceMemberId: "m_source", targetMemberId: "m_target" }),
      JSON.stringify({ dismissalId: "dismissal_1", dismissedAt: "2026-04-29T15:30:00.000Z" }),
      "2026-04-29T15:30:00.000Z",
    ],
    [
      "audit_003",
      "other@example.com",
      "member.note.created",
      "member",
      "m1",
      null,
      "{broken",
      "2026-04-29T15:00:00.000Z",
    ],
    [
      "audit_006",
      "owner@example.com",
      "admin.member.tag_assigned",
      "member",
      "m_bulk_1",
      null,
      JSON.stringify({ tagId: "tag_a", source: "manual", batchId: "batch-1079" }),
      "2026-04-30T16:00:00.000Z",
    ],
    [
      "audit_007",
      "owner@example.com",
      "admin.member.tag_unassigned",
      "member",
      "m_bulk_2",
      JSON.stringify({ tagId: "tag_b", batchId: "batch-1079" }),
      null,
      "2026-04-30T15:59:00.000Z",
    ],
    [
      "audit_008",
      "owner@example.com",
      "admin.member.tag_assigned",
      "member",
      "m_bulk_3",
      null,
      JSON.stringify({ tagId: "tag_c", source: "manual", batchId: "batch-other" }),
      "2026-04-30T15:58:00.000Z",
    ],
  ];
  for (const row of rows) {
    await env.db
      .prepare(
        "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
      )
      .bind(...row)
      .run();
  }
};

const seedSingleTagWriteFixtures = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO member_identities
       (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m_single','single@example.com','r_single','r_single','2026-06-07T00:00:00Z')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted)
       VALUES ('m_single','consented','consented','public',0)`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
       VALUES ('tag_single','single','単一タグ','misc','[]',1)`,
    )
    .run();
};

const latestBatchId = async (
  env: InMemoryD1,
  action: "admin.member.tag_assigned" | "admin.member.tag_unassigned",
  column: "before_json" | "after_json",
): Promise<string> => {
  const r = await env.db
    .prepare(
      `SELECT json_extract(${column}, '$.batchId') AS batchId
       FROM audit_log
       WHERE action=?1 AND target_id='m_single'
       ORDER BY created_at DESC, audit_id DESC
       LIMIT 1`,
    )
    .bind(action)
    .first<{ batchId: string | null }>();
  expect(r?.batchId).toEqual(expect.any(String));
  return r?.batchId ?? "";
};

describe("admin audit route", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seedAudit(env);
  }, 30000);

  it("authz: 未認証は 401", async () => {
    const app = createAdminAuditRoute();
    const res = await app.request("/audit", {}, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("GET /audit: filters, JST range, masked JSON projection, raw JSON 非露出", async () => {
    const app = createAdminAuditRoute();
    const res = await app.request(
      "/audit?action=attendance.add&actorEmail=OWNER%40EXAMPLE.COM&targetType=meeting&targetId=s1&from=2026-04-30T23:00&to=2026-05-01T00:00",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<Record<string, unknown>>;
      appliedFilters: { actorEmail: string };
    };
    expect(body.items).toHaveLength(1);
    expect(body.appliedFilters.actorEmail).toBe("owner@example.com");
    expect(body.items[0]).toMatchObject({
      auditId: "audit_001",
      actorEmail: "owner@example.com",
      action: "attendance.add",
      targetType: "meeting",
      targetId: "s1",
      parseError: false,
    });
    expect(body.items[0]).not.toHaveProperty("beforeJson");
    expect(body.items[0]).not.toHaveProperty("afterJson");
    expect(JSON.stringify(body)).not.toContain("person@example.com");
    expect(JSON.stringify(body)).not.toContain("090-1111-2222");
    expect(JSON.stringify(body)).not.toContain("Person One");
    expect(JSON.stringify(body)).not.toContain("Display One");
    expect(JSON.stringify(body)).not.toContain("090-3333-4444");
    expect(JSON.stringify(body)).not.toContain("650-0000");
    expect(body.items[0]?.maskedAfter).toMatchObject({
      responseEmail: "[masked]",
      phone: "[masked]",
      nested: {
        fullName: "[masked]",
        displayName: "[masked]",
        mobile: "[masked]",
        postalCode: "[masked]",
        note: "visible",
      },
    });
  });

  it("GET /audit: UTC ISO range query を受け付ける", async () => {
    const app = createAdminAuditRoute();
    const res = await app.request(
      "/audit?action=attendance.add&from=2026-04-30T14%3A00%3A00.000Z&to=2026-04-30T15%3A00%3A00.000Z",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<{ auditId: string }> };
    expect(body.items.map((i) => i.auditId)).toEqual(["audit_001"]);
  });

  it("GET /audit: broken JSON は parseError true で raw を返さない", async () => {
    const app = createAdminAuditRoute();
    const res = await app.request(
      "/audit?action=member.note.created",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: Array<Record<string, unknown>> };
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.parseError).toBe(true);
    expect(JSON.stringify(body)).not.toContain("{broken");
  });

  it("GET /audit: identity.dismiss action filter returns dismiss audit", async () => {
    const app = createAdminAuditRoute();
    const res = await app.request(
      "/audit?action=identity.dismiss&targetType=member&targetId=m_target",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ auditId: string; action: string; targetType: string; targetId: string }>;
    };
    expect(body.items.map(({ auditId, action, targetType, targetId }) => ({
      auditId,
      action,
      targetType,
      targetId,
    }))).toEqual([
      {
        auditId: "audit_005",
        action: "identity.dismiss",
        targetType: "member",
        targetId: "m_target",
      },
    ]);
  });

  it("GET /audit: batchId filters assign after_json and unassign before_json rows", async () => {
    const app = createAdminAuditRoute();
    const res = await app.request(
      "/audit?batchId=batch-1079",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{
        auditId: string;
        action: string;
        maskedBefore: unknown;
        maskedAfter: unknown;
      }>;
      appliedFilters: { batchId: string | null };
    };
    expect(body.appliedFilters.batchId).toBe("batch-1079");
    expect(body.items.map((item) => item.auditId)).toEqual(["audit_006", "audit_007"]);
    expect(body.items.map((item) => item.action)).toEqual([
      "admin.member.tag_assigned",
      "admin.member.tag_unassigned",
    ]);
    expect(JSON.stringify(body.items)).toContain("batch-1079");
    expect(JSON.stringify(body.items)).not.toContain("batch-other");
  });

  it("GET /audit: single tag write batchId hits assign after_json and unassign before_json", async () => {
    await seedSingleTagWriteFixtures(env);
    const root = new Hono();
    root.route("/admin", createAdminMembersRoute());
    root.route("/admin", createAdminAuditRoute());
    const headers = { ...(await adminAuthHeader()), "content-type": "application/json" };

    const assign = await root.request(
      "/admin/members/m_single/tags",
      {
        method: "POST",
        headers,
        body: JSON.stringify({ tagId: "tag_single" }),
      },
      makeEnv(env),
    );
    expect(assign.status).toBe(200);
    const assignBatchId = await latestBatchId(
      env,
      "admin.member.tag_assigned",
      "after_json",
    );

    const assignAudit = await root.request(
      `/admin/audit?batchId=${encodeURIComponent(assignBatchId)}`,
      { headers },
      makeEnv(env),
    );
    expect(assignAudit.status).toBe(200);
    const assignBody = (await assignAudit.json()) as {
      items: Array<{ action: string; targetId: string; maskedAfter: unknown }>;
      appliedFilters: { batchId: string | null };
    };
    // batchId の検索ヒットは raw json_extract('$.batchId') を使う appliedFilters /
    // length で検証する（masked payload は PII redaction を経るため batchId 表示の
    // verbatim 保持は redact.spec.ts で別途固定する。ここで masked 値へ equality を
    // 課すと、redaction 仕様変更時に脆く・UUID 依存の flake 源になる）。
    expect(assignBody.appliedFilters.batchId).toBe(assignBatchId);
    expect(assignBody.items).toHaveLength(1);
    expect(assignBody.items[0]).toMatchObject({
      action: "admin.member.tag_assigned",
      targetId: "m_single",
      maskedAfter: { tagId: "tag_single", source: "manual" },
    });

    const unassign = await root.request(
      "/admin/members/m_single/tags/tag_single",
      { method: "DELETE", headers },
      makeEnv(env),
    );
    expect(unassign.status).toBe(204);
    const unassignBatchId = await latestBatchId(
      env,
      "admin.member.tag_unassigned",
      "before_json",
    );
    expect(unassignBatchId).not.toBe(assignBatchId);

    const unassignAudit = await root.request(
      `/admin/audit?batchId=${encodeURIComponent(unassignBatchId)}`,
      { headers },
      makeEnv(env),
    );
    expect(unassignAudit.status).toBe(200);
    const unassignBody = (await unassignAudit.json()) as {
      items: Array<{ action: string; targetId: string; maskedBefore: unknown }>;
      appliedFilters: { batchId: string | null };
    };
    expect(unassignBody.appliedFilters.batchId).toBe(unassignBatchId);
    expect(unassignBody.items).toHaveLength(1);
    expect(unassignBody.items[0]).toMatchObject({
      action: "admin.member.tag_unassigned",
      targetId: "m_single",
      maskedBefore: { tagId: "tag_single" },
    });

    const bulkAudit = await root.request(
      "/admin/audit?batchId=batch-1079",
      { headers },
      makeEnv(env),
    );
    expect(bulkAudit.status).toBe(200);
    const bulkBody = (await bulkAudit.json()) as {
      items: Array<{ auditId: string }>;
    };
    expect(bulkBody.items.map((item) => item.auditId)).toEqual(["audit_006", "audit_007"]);
  });

  it("GET /audit: action and batchId filters are combined with AND", async () => {
    const app = createAdminAuditRoute();
    const res = await app.request(
      "/audit?action=admin.member.tag_assigned&batchId=batch-1079",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ auditId: string; action: string }>;
      appliedFilters: { action: string | null; batchId: string | null };
    };
    expect(body.appliedFilters).toMatchObject({
      action: "admin.member.tag_assigned",
      batchId: "batch-1079",
    });
    expect(body.items.map(({ auditId, action }) => ({ auditId, action }))).toEqual([
      { auditId: "audit_006", action: "admin.member.tag_assigned" },
    ]);
  });

  it("GET /audit: batchId filter is preserved across cursor pagination", async () => {
    const app = createAdminAuditRoute();
    const headers = { ...(await adminAuthHeader()) };
    const first = await app.request(
      "/audit?batchId=batch-1079&limit=1",
      { headers },
      makeEnv(env),
    );
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as {
      items: Array<{ auditId: string }>;
      nextCursor: string | null;
    };
    expect(firstBody.items.map((item) => item.auditId)).toEqual(["audit_006"]);
    expect(firstBody.nextCursor).toBeTruthy();

    const second = await app.request(
      `/audit?batchId=batch-1079&limit=1&cursor=${encodeURIComponent(firstBody.nextCursor ?? "")}`,
      { headers },
      makeEnv(env),
    );
    expect(second.status).toBe(200);
    const secondBody = (await second.json()) as {
      items: Array<{ auditId: string }>;
      nextCursor: string | null;
    };
    expect(secondBody.items.map((item) => item.auditId)).toEqual(["audit_007"]);
    expect(secondBody.nextCursor).toBeNull();
  });

  it("GET /audit: empty and unmatched batchId do not fail", async () => {
    const app = createAdminAuditRoute();
    const headers = { ...(await adminAuthHeader()) };
    const empty = await app.request("/audit?batchId=&limit=100", { headers }, makeEnv(env));
    expect(empty.status).toBe(200);
    const emptyBody = (await empty.json()) as {
      items: Array<{ auditId: string }>;
      appliedFilters: { batchId: string | null };
    };
    expect(emptyBody.appliedFilters.batchId).toBeNull();
    expect(emptyBody.items.length).toBeGreaterThan(2);

    const unmatched = await app.request(
      "/audit?batchId=batch-missing",
      { headers },
      makeEnv(env),
    );
    expect(unmatched.status).toBe(200);
    const unmatchedBody = (await unmatched.json()) as {
      items: unknown[];
      nextCursor: string | null;
      appliedFilters: { batchId: string | null };
    };
    expect(unmatchedBody.items).toEqual([]);
    expect(unmatchedBody.nextCursor).toBeNull();
    expect(unmatchedBody.appliedFilters.batchId).toBe("batch-missing");
  });

  it("GET /audit: admin_member_note filter は request audit のみを返し legacy member 行は読める", async () => {
    const app = createAdminAuditRoute();
    const headers = { ...(await adminAuthHeader()) };

    const requestAudit = await app.request(
      "/audit?targetType=admin_member_note",
      { headers },
      makeEnv(env),
    );
    expect(requestAudit.status).toBe(200);
    const requestBody = (await requestAudit.json()) as {
      items: Array<{ auditId: string; targetType: string; targetId: string }>;
    };
    expect(requestBody.items.map(({ auditId, targetType, targetId }) => ({
      auditId,
      targetType,
      targetId,
    }))).toEqual([
      { auditId: "audit_004", targetType: "admin_member_note", targetId: "note_1" },
    ]);

    const legacyMember = await app.request(
      "/audit?targetType=member",
      { headers },
      makeEnv(env),
    );
    expect(legacyMember.status).toBe(200);
    const legacyBody = (await legacyMember.json()) as {
      items: Array<{ auditId: string; targetType: string; targetId: string }>;
    };
    expect(legacyBody.items.map(({ auditId, targetType, targetId }) => ({
      auditId,
      targetType,
      targetId,
    }))).toEqual([
      { auditId: "audit_006", targetType: "member", targetId: "m_bulk_1" },
      { auditId: "audit_007", targetType: "member", targetId: "m_bulk_2" },
      { auditId: "audit_008", targetType: "member", targetId: "m_bulk_3" },
      { auditId: "audit_005", targetType: "member", targetId: "m_target" },
      { auditId: "audit_003", targetType: "member", targetId: "m1" },
    ]);
  });

  it("GET /audit: admin_member_note filter 下でも cursor pagination が壊れない", async () => {
    await env.db
      .prepare(
        "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5, NULL, ?6, ?7)",
      )
      .bind(
        "audit_note_006",
        "owner@example.com",
        "admin.request.reject",
        "admin_member_note",
        "note_2",
        JSON.stringify({ noteId: "note_2", memberId: "m2", resolution: "reject" }),
        "2026-04-29T17:00:00.000Z",
      )
      .run();

    const app = createAdminAuditRoute();
    const headers = { ...(await adminAuthHeader()) };
    const first = await app.request(
      "/audit?targetType=admin_member_note&limit=1",
      { headers },
      makeEnv(env),
    );
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as {
      items: Array<{ auditId: string; targetType: string }>;
      nextCursor: string | null;
    };
    expect(firstBody.items.map(({ auditId, targetType }) => ({ auditId, targetType }))).toEqual([
      { auditId: "audit_note_006", targetType: "admin_member_note" },
    ]);
    expect(firstBody.nextCursor).toBeTruthy();

    const second = await app.request(
      `/audit?targetType=admin_member_note&limit=1&cursor=${encodeURIComponent(firstBody.nextCursor ?? "")}`,
      { headers },
      makeEnv(env),
    );
    expect(second.status).toBe(200);
    const secondBody = (await second.json()) as {
      items: Array<{ auditId: string; targetType: string }>;
      nextCursor: string | null;
    };
    expect(secondBody.items.map(({ auditId, targetType }) => ({ auditId, targetType }))).toEqual([
      { auditId: "audit_004", targetType: "admin_member_note" },
    ]);
    expect(secondBody.nextCursor).toBeNull();
  });

  it("GET /audit: limit 1-100 と invalid cursor を 400 にする", async () => {
    const app = createAdminAuditRoute();
    const headers = { ...(await adminAuthHeader()) };
    const limitRes = await app.request("/audit?limit=101", { headers }, makeEnv(env));
    expect(limitRes.status).toBe(400);

    const cursorRes = await app.request("/audit?cursor=not-base64", { headers }, makeEnv(env));
    expect(cursorRes.status).toBe(400);
  });

  it("GET /audit: cursor pagination は filter 状態を維持する", async () => {
    const app = createAdminAuditRoute();
    const first = await app.request(
      "/audit?targetType=meeting&limit=1",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as {
      items: Array<{ auditId: string }>;
      nextCursor: string | null;
    };
    expect(firstBody.items.map((i) => i.auditId)).toEqual(["audit_002"]);
    expect(firstBody.nextCursor).toBeTruthy();

    const second = await app.request(
      `/audit?targetType=meeting&limit=1&cursor=${encodeURIComponent(firstBody.nextCursor ?? "")}`,
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(second.status).toBe(200);
    const secondBody = (await second.json()) as { items: Array<{ auditId: string }> };
    expect(secondBody.items.map((i) => i.auditId)).toEqual(["audit_001"]);
  });

  // admin-audit-prototype-alignment / Task B: `/admin/audit` を root mount 経由で叩いて
  // 200 を返す回帰ケース。H2（mount 順序衝突）の再発検知のため、`createAdminAuditRoute`
  // 直接ではなく `new Hono().route("/admin", ...)` でラップして request する。
  it("GET /admin/audit: routed via root mount returns 200", async () => {
    const root = new Hono();
    root.route("/admin", createAdminAuditRoute());
    const res = await root.request(
      "/admin/audit?limit=1",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: true; items: unknown[] };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.items)).toBe(true);
  });

  it("GET /audit: syntactically valid but unknown cursor returns empty page", async () => {
    const app = createAdminAuditRoute();
    const cursor = encodeAuditCursor({
      createdAt: "1900-01-01T00:00:00.000Z",
      auditId: "audit_000",
    });
    const res = await app.request(
      `/audit?cursor=${encodeURIComponent(cursor)}`,
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[]; nextCursor: string | null };
    expect(body.items).toEqual([]);
    expect(body.nextCursor).toBeNull();
  });
});
