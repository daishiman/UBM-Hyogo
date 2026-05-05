// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminAuditRoute, encodeAuditCursor } from "./audit";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
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
      "audit_003",
      "other@example.com",
      "member.note.created",
      "member",
      "m1",
      null,
      "{broken",
      "2026-04-29T15:00:00.000Z",
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
