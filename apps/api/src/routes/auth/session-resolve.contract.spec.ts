// @vitest-environment node
// 05a Phase 4: session-resolve test matrix R-01〜R-06 + internal-auth (Q1)
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createSessionResolveRoute } from "./session-resolve";

const INTERNAL = "internal-test-secret";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  INTERNAL_AUTH_SECRET: INTERNAL,
});

const seedIdentity = async (
  env: InMemoryD1,
  memberId: string,
  email: string,
) => {
  await env.db
    .prepare(
      `INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?5, ?5)`,
    )
    .bind(memberId, email, `r_${memberId}`, `r_${memberId}`, "2026-04-01T00:00:00Z")
    .run();
};

const seedStatus = async (
  env: InMemoryD1,
  memberId: string,
  rulesConsent: string,
  isDeleted: number,
) => {
  await env.db
    .prepare(
      `INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_at)
       VALUES (?1, 'consented', ?2, 'public', ?3, '2026-04-01T00:00:00Z')`,
    )
    .bind(memberId, rulesConsent, isDeleted)
    .run();
};

const seedAdmin = async (env: InMemoryD1, email: string) => {
  await env.db
    .prepare(
      `INSERT INTO admin_users (admin_id, email, display_name, active, created_at)
       VALUES (?1, ?2, 'Admin', 1, '2026-04-01T00:00:00Z')`,
    )
    .bind(`adm_${email}`, email)
    .run();
};

describe("GET /auth/session-resolve", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("AC: INTERNAL_AUTH_SECRET 不一致 → 401", async () => {
    const app = createSessionResolveRoute();
    const res = await app.request(
      "/session-resolve?email=foo@example.com",
      { headers: { "x-internal-auth": "wrong" } },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });

  it("AC: INTERNAL_AUTH_SECRET 未設定 → 500", async () => {
    const app = createSessionResolveRoute();
    const res = await app.request(
      "/session-resolve?email=foo@example.com",
      { headers: { "x-internal-auth": "x" } },
      { DB: env.db as unknown as D1Database },
    );
    expect(res.status).toBe(500);
  });

  it("R-06: email クエリ無し → 400", async () => {
    const app = createSessionResolveRoute();
    const res = await app.request(
      "/session-resolve",
      { headers: { "x-internal-auth": INTERNAL } },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("R-01: identity 無し → unregistered", async () => {
    const app = createSessionResolveRoute();
    const res = await app.request(
      "/session-resolve?email=unknown@example.com",
      { headers: { "x-internal-auth": INTERNAL } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({
      memberId: null,
      isAdmin: false,
      gateReason: "unregistered",
    });
  });

  it("R-02: is_deleted=1 → deleted", async () => {
    await seedIdentity(env, "m_del", "deleted@example.com");
    await seedStatus(env, "m_del", "consented", 1);
    const app = createSessionResolveRoute();
    const res = await app.request(
      "/session-resolve?email=deleted@example.com",
      { headers: { "x-internal-auth": INTERNAL } },
      makeEnv(env),
    );
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.gateReason).toBe("deleted");
    expect(body.memberId).toBeNull();
  });

  it("R-03: rules_consent != consented → rules_declined", async () => {
    await seedIdentity(env, "m_rd", "rd@example.com");
    await seedStatus(env, "m_rd", "unknown", 0);
    const app = createSessionResolveRoute();
    const res = await app.request(
      "/session-resolve?email=rd@example.com",
      { headers: { "x-internal-auth": INTERNAL } },
      makeEnv(env),
    );
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.gateReason).toBe("rules_declined");
    expect(body.memberId).toBeNull();
  });

  it("R-04: 一般 member（admin_users 無し） → memberId 返却 / isAdmin=false", async () => {
    await seedIdentity(env, "m_001", "user@example.com");
    await seedStatus(env, "m_001", "consented", 0);
    const app = createSessionResolveRoute();
    const res = await app.request(
      "/session-resolve?email=user@example.com",
      { headers: { "x-internal-auth": INTERNAL } },
      makeEnv(env),
    );
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({
      memberId: "m_001",
      isAdmin: false,
      gateReason: null,
    });
  });

  it("R-05: admin_users 登録あり → isAdmin=true", async () => {
    await seedIdentity(env, "m_adm", "admin@example.com");
    await seedStatus(env, "m_adm", "consented", 0);
    await seedAdmin(env, "admin@example.com");
    const app = createSessionResolveRoute();
    const res = await app.request(
      "/session-resolve?email=admin@example.com",
      { headers: { "x-internal-auth": INTERNAL } },
      makeEnv(env),
    );
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({
      memberId: "m_adm",
      isAdmin: true,
      gateReason: null,
    });
  });

  it("email 大文字混在は normalize されて lookup される", async () => {
    await seedIdentity(env, "m_001", "user@example.com");
    await seedStatus(env, "m_001", "consented", 0);
    const app = createSessionResolveRoute();
    const res = await app.request(
      "/session-resolve?email=User@Example.COM",
      { headers: { "x-internal-auth": INTERNAL } },
      makeEnv(env),
    );
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.memberId).toBe("m_001");
  });
});
