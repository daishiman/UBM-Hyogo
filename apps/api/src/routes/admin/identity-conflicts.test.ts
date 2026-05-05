// @vitest-environment node
// issue-194-03b-followup-001-email-conflict-identity-merge
// route contract / authorization tests
import { beforeEach, describe, expect, it } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminIdentityConflictsRoute } from "./identity-conflicts";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "admin-token",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

const seedDuplicateIdentities = async (env: InMemoryD1) => {
  for (const [responseId, memberId, email, submittedAt] of [
    ["r_old", "m_target", "old@example.com", "2026-01-01T00:00:00.000Z"],
    ["r_new", "m_source", "new@example.com", "2026-02-01T00:00:00.000Z"],
  ] as const) {
    await env.db
      .prepare(
        `INSERT INTO member_responses
          (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json, search_text)
         VALUES (?1, 'f1', 'rev1', 'h1', ?2, ?3, '{}', '')`,
      )
      .bind(responseId, email, submittedAt)
      .run();
    await env.db
      .prepare(
        `INSERT INTO member_identities
          (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
         VALUES (?1, ?2, ?3, ?3, ?4)`,
      )
      .bind(memberId, email, responseId, submittedAt)
      .run();
    await env.db
      .prepare(
        `INSERT INTO response_fields (response_id, stable_key, value_json)
         VALUES (?1, 'fullName', json_quote('山田太郎'))`,
      )
      .bind(responseId)
      .run();
    await env.db
      .prepare(
        `INSERT INTO response_fields (response_id, stable_key, value_json)
         VALUES (?1, 'occupation', json_quote('ACME'))`,
      )
      .bind(responseId)
      .run();
  }
};

describe("admin identity-conflicts route", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
    await seedDuplicateIdentities(env);
  }, 60000);

  it("requires admin authorization", async () => {
    const app = createAdminIdentityConflictsRoute();
    const res = await app.request("/identity-conflicts", {}, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("lists conflict candidates with masked email", async () => {
    const app = createAdminIdentityConflictsRoute();
    const res = await app.request(
      "/identity-conflicts",
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ conflictId: string; responseEmailMasked: string }>;
    };
    expect(body.items).toHaveLength(1);
    expect(body.items[0]!.conflictId).toBe("m_source__m_target");
    expect(body.items[0]!.responseEmailMasked).toBe("n***@example.com");
  });

  it("rejects merge target mismatch", async () => {
    const app = createAdminIdentityConflictsRoute();
    const res = await app.request(
      "/identity-conflicts/m_source__m_target/merge",
      {
        method: "POST",
        headers: {
          ...(await adminAuthHeader()),
          "content-type": "application/json",
        },
        body: JSON.stringify({ targetMemberId: "m_other", reason: "mismatch" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "TARGET_MEMBER_MISMATCH" });
  });

  it("translates duplicate merge to 409", async () => {
    const app = createAdminIdentityConflictsRoute();
    const headers = {
      ...(await adminAuthHeader()),
      "content-type": "application/json",
    };
    const first = await app.request(
      "/identity-conflicts/m_source__m_target/merge",
      {
        method: "POST",
        headers,
        body: JSON.stringify({ targetMemberId: "m_target", reason: "same person" }),
      },
      makeEnv(env),
    );
    expect(first.status).toBe(200);

    const second = await app.request(
      "/identity-conflicts/m_source__m_target/merge",
      {
        method: "POST",
        headers,
        body: JSON.stringify({ targetMemberId: "m_target", reason: "same person" }),
      },
      makeEnv(env),
    );
    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({ error: "ALREADY_MERGED" });
  });
});
