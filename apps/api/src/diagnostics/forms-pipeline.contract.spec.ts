// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { setupD1, withLegacyMemberStatus, type InMemoryD1 } from "../repository/__tests__/_setup";
import { adminAuthHeader, TEST_AUTH_SECRET } from "../routes/admin/_test-auth";
import { createDiagnosticsRouter } from "./forms-pipeline";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  AUTH_SECRET: TEST_AUTH_SECRET,
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "forms@example.iam.gserviceaccount.com",
  GOOGLE_PRIVATE_KEY: "private-key",
  GOOGLE_FORM_ID: "form-1",
});

describe("GET /admin/diagnostics/forms-pipeline", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
    await env.db
      .prepare(
        "INSERT INTO sync_jobs (job_id, job_type, started_at, finished_at, status, metrics_json) VALUES ('job-1','response_sync','2026-05-26T00:00:00Z','2026-05-26T00:00:01Z','succeeded',?1)",
      )
      .bind(JSON.stringify({ responsesFetched: 1 }))
      .run();
    await env.db
      .prepare(
        "INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json) VALUES ('r1','form-1','rev-1','hash','a@example.com','2026-05-26T00:00:00Z','{}')",
      )
      .run();
    await env.db
      .prepare(
        "INSERT INTO response_fields (response_id, stable_key, value_json) VALUES ('r1','fullName',?1)",
      )
      .bind(JSON.stringify("Alice"))
      .run();
    await env.db
      .prepare(
        "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m1','a@example.com','r1','r1','2026-05-26T00:00:00Z')",
      )
      .run();
    await env.db
      .prepare(
        "INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted) VALUES ('m1','consented','consented','public',0)",
      )
      .run();
  }, 30000);

  it("returns read-only H1-H4 snapshot with boolean-only secret readiness", async () => {
    const app = createDiagnosticsRouter();
    const res = await app.request(
      "/forms-pipeline",
      { headers: await adminAuthHeader() },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["counts"]).toMatchObject({ formResponses: 1, responseFields: 1 });
    expect(body["hypothesisFlags"]).toMatchObject({
      H1_ingestNeverRanOrAllErrors: false,
      H4_aliasPendingNonZero: false,
    });
    expect(body["secretsReadiness"]).toEqual({
      googleServiceAccountEmail: true,
      googlePrivateKey: true,
      googleFormId: true,
      authSecret: true,
    });
    // members-not-displaying Task A: 新フィールドが parse される
    expect(body["publicConsentBreakdown"]).toMatchObject({ consented: 1 });
    expect(body["publishStateBreakdown"]).toMatchObject({ public: 1 });
    expect(body["visiblePublicCount"]).toBe(1);
    expect(typeof body["lastSuccessfulSyncAt"]).toBe("string");
    expect(body["totals"]).toMatchObject({
      memberIdentities: 1,
      memberResponses: 1,
      memberStatus: 1,
    });
    expect(typeof body["diagnosis"]).toBe("string");
  });

  it("counts status rows without identity as H2 mismatch candidates", async () => {
    // 0026 の FK 導入後、orphan な member_status は構造的に作れない。H2 診断は
    // FK 導入前から残る legacy orphan を検出する用途なので、FK なしの legacy schema で
    // その状態を再現してから検証する（callback 終了時に 0026 が再適用され FK 復元）。
    await withLegacyMemberStatus(env.db, async () => {
      await env.db
        .prepare(
          "INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted) VALUES ('m-without-identity','consented','consented','public',0)",
        )
        .run();

      const app = createDiagnosticsRouter();
      const res = await app.request(
        "/forms-pipeline",
        { headers: await adminAuthHeader() },
        makeEnv(env),
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        identityHealth: { membersWithoutIdentity: number };
        hypothesisFlags: { H2_identityMismatchSuspected: boolean };
      };
      expect(body.identityHealth.membersWithoutIdentity).toBe(1);
      expect(body.hypothesisFlags.H2_identityMismatchSuspected).toBe(true);
    });
  });
});
