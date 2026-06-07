// members-not-displaying-form-sync-investigation Task C:
// POST /admin/sync/backfill-publish-state — D1 in-memory test
// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { adminSyncBackfillPublishStateRoute } from "./sync-backfill-publish-state";

const TOKEN = "sync-token-test-value";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: TOKEN,
});

const seed = async (env: InMemoryD1) => {
  const cases: Array<[string, string, string, string | null, number]> = [
    ["m-consent-member", "consented", "member_only", null, 0],
    ["m-already-public", "consented", "public", null, 0],
    ["m-admin-override", "consented", "member_only", "admin@example.com", 0],
    ["m-hidden", "consented", "hidden", null, 0],
    ["m-no-consent", "unknown", "member_only", null, 0],
    ["m-deleted", "consented", "member_only", null, 1],
  ];
  for (const [memberId, consent, publish, updatedBy, isDeleted] of cases) {
    // member_status.member_id は member_identities(member_id) への FK（0026）を持つため、
    // 親 identity 行を先に挿入してから member_status を seed する。
    await env.db
      .prepare(
        `INSERT INTO member_identities
          (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
         VALUES (?1, ?2, ?3, ?3, '2026-06-05T00:00:00Z')`,
      )
      .bind(memberId, `${memberId}@example.com`, `response-${memberId}`)
      .run();
    await env.db
      .prepare(
        `INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, updated_by, is_deleted)
         VALUES (?1, ?2, 'consented', ?3, ?4, ?5)`,
      )
      .bind(memberId, consent, publish, updatedBy, isDeleted)
      .run();
  }
};

describe("POST /admin/sync/backfill-publish-state", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seed(env);
  }, 30000);

  it("auth 無しは 401", async () => {
    const res = await adminSyncBackfillPublishStateRoute.request(
      "/sync/backfill-publish-state",
      { method: "POST" },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });

  it("dryRun=true (default) は candidates をカウントするが UPDATE しない", async () => {
    const res = await adminSyncBackfillPublishStateRoute.request(
      "/sync/backfill-publish-state",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["dryRun"]).toBe(true);
    expect(body["scanned"]).toBe(6);
    expect(body["candidates"]).toBe(1);
    expect(body["applied"]).toBe(0);
    // m-hidden は currentPublishState='hidden' のため adminExplicit に分類される
    expect(body["skipped"]).toMatchObject({
      alreadyPublic: 1,
      adminExplicit: 2,
      consentNotMet: 1,
      deleted: 1,
    });
    // DB は不変
    const row = await env.db
      .prepare("SELECT publish_state, updated_by FROM member_status WHERE member_id = 'm-consent-member'")
      .first<{ publish_state: string; updated_by: string | null }>();
    expect(row?.publish_state).toBe("member_only");
    expect(row?.updated_by).toBeNull();
  });

  it("dryRun=false は candidates を applied として UPDATE する", async () => {
    const res = await adminSyncBackfillPublishStateRoute.request(
      "/sync/backfill-publish-state?dryRun=false",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["applied"]).toBe(1);
    const row = await env.db
      .prepare(
        "SELECT publish_state, updated_by FROM member_status WHERE member_id = 'm-consent-member'",
      )
      .first<{ publish_state: string; updated_by: string }>();
    expect(row?.publish_state).toBe("public");
    expect(row?.updated_by).toBe("system:backfill");
  });

  it("apply 後の再実行は applied=0 で idempotent", async () => {
    await adminSyncBackfillPublishStateRoute.request(
      "/sync/backfill-publish-state?dryRun=false",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      makeEnv(env),
    );
    const res = await adminSyncBackfillPublishStateRoute.request(
      "/sync/backfill-publish-state?dryRun=false",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      makeEnv(env),
    );
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["candidates"]).toBe(0);
    expect(body["applied"]).toBe(0);
  });

  it("admin override (updated_by='admin@...') は適用されない", async () => {
    await adminSyncBackfillPublishStateRoute.request(
      "/sync/backfill-publish-state?dryRun=false",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      makeEnv(env),
    );
    const row = await env.db
      .prepare(
        "SELECT publish_state, updated_by FROM member_status WHERE member_id = 'm-admin-override'",
      )
      .first<{ publish_state: string; updated_by: string }>();
    expect(row?.publish_state).toBe("member_only");
    expect(row?.updated_by).toBe("admin@example.com");
  });

  it("hidden は consent に関わらず維持される", async () => {
    await adminSyncBackfillPublishStateRoute.request(
      "/sync/backfill-publish-state?dryRun=false",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      makeEnv(env),
    );
    const row = await env.db
      .prepare("SELECT publish_state FROM member_status WHERE member_id = 'm-hidden'")
      .first<{ publish_state: string }>();
    expect(row?.publish_state).toBe("hidden");
  });
});
