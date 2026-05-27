// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { setupD1, type InMemoryD1 } from "../repository/__tests__/_setup";
import { adminAuthHeader, TEST_AUTH_SECRET } from "../routes/admin/_test-auth";
import { createDiagnosticsRouter } from "./forms-pipeline";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  AUTH_SECRET: TEST_AUTH_SECRET,
});

describe("GET /admin/diagnostics/member/:memberId", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
    await env.db
      .prepare(
        "INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json) VALUES ('r1','form-1','rev-1','hash','a@example.com','2026-05-26T00:00:00Z','{}')",
      )
      .run();
    await env.db
      .prepare(
        "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m1','a@example.com','r1','r1','2026-05-26T00:00:00Z')",
      )
      .run();
    await env.db
      .prepare(
        "INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted) VALUES ('m1','consented','consented','member_only',0)",
      )
      .run();
    await env.db
      .prepare(
        "INSERT INTO schema_questions (question_pk, revision_id, stable_key, section_key, section_title, label, kind, position) VALUES ('q1','rev-1','fullName','profile','Profile','Name','text',1)",
      )
      .run();
  }, 30000);

  it("returns member diagnosis without exposing profile values", async () => {
    const app = createDiagnosticsRouter();
    const res = await app.request(
      "/member/m1",
      { headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["memberId"]).toBe("m1");
    expect(body["responseFieldCount"]).toBe(0);
    expect(body["missingFieldKeys"]).toEqual(["fullName"]);
    expect(JSON.stringify(body)).not.toContain("a@example.com");
  });

  it("returns H2 identity missing for a member status row without identity", async () => {
    await env.db
      .prepare(
        "INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted) VALUES ('m2','consented','consented','public',0)",
      )
      .run();

    const app = createDiagnosticsRouter();
    const res = await app.request(
      "/member/m2",
      { headers: await adminAuthHeader() },
      makeEnv(env),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["identityMatches"]).toMatchObject({
      byEmail: false,
      byExternalId: false,
      matchedFormResponseId: null,
    });
    expect(body["hypothesisFlags"]).toMatchObject({
      H2_identityMissing: true,
      H4_missingFieldsNonEmpty: false,
    });
  });
});
