// members-not-displaying-form-sync-investigation Task A:
// GET /admin/sync/diagnostics/forms-pipeline (SYNC_ADMIN_TOKEN bearer) contract test
// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { adminSyncDiagnosticsRoute } from "./sync-diagnostics";

const TOKEN = "sync-token-test-value";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: TOKEN,
  AUTH_SECRET: "0123456789012345678901234567890123456789",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "forms@example.iam.gserviceaccount.com",
  GOOGLE_PRIVATE_KEY: "private-key",
  GOOGLE_FORM_ID: "form-1",
});

describe("GET /admin/sync/diagnostics/forms-pipeline", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("Authorization 無しは 401", async () => {
    const res = await adminSyncDiagnosticsRoute.request(
      "/diagnostics/forms-pipeline",
      { method: "GET" },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });

  it("誤った token は 401", async () => {
    const res = await adminSyncDiagnosticsRoute.request(
      "/diagnostics/forms-pipeline",
      { method: "GET", headers: { authorization: "Bearer wrong" } },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });

  it("正しい token は 200 で snapshot を返す（新フィールド含む）", async () => {
    const res = await adminSyncDiagnosticsRoute.request(
      "/diagnostics/forms-pipeline",
      { method: "GET", headers: { authorization: `Bearer ${TOKEN}` } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["publicConsentBreakdown"]).toBeDefined();
    expect(body["publishStateBreakdown"]).toBeDefined();
    expect(typeof body["visiblePublicCount"]).toBe("number");
    expect("lastSuccessfulSyncAt" in body).toBe(true);
    expect(body["totals"]).toBeDefined();
    expect(typeof body["diagnosis"]).toBe("string");
    // secretsReadiness は boolean only
    const sr = body["secretsReadiness"] as Record<string, unknown>;
    for (const v of Object.values(sr)) {
      expect(typeof v).toBe("boolean");
    }
  });
});
