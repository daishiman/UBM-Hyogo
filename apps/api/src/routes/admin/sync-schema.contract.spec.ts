// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminSyncSchemaRoute } from "./sync-schema";
import { FORMS_GET_31_ITEMS } from "../../../tests/fixtures/forms-get";
import * as syncJobs from "../../repository/syncJobs";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  GOOGLE_FORM_ID: "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg",
  SYNC_ADMIN_TOKEN: "admin-token-x",
});

const makeApp = (env: InMemoryD1) =>
  createAdminSyncSchemaRoute(() => ({
    ctx: env.ctx,
    formsClient: {
      getForm: async () => {
        throw new Error("not used");
      },
      getRawForm: async () => FORMS_GET_31_ITEMS,
    },
  }));

describe("POST /admin/sync/schema (contract)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("authz: Authorization 未指定は 401", async () => {
    const app = makeApp(env);
    const res = await app.request("/sync/schema", {
      method: "POST",
      headers: {},
    }, makeEnv(env));
    expect(res.status).toBe(401);
  });

  it("authz: 一般会員（不一致トークン）は 403", async () => {
    const app = makeApp(env);
    const res = await app.request(
      "/sync/schema",
      { method: "POST", headers: { Authorization: "Bearer wrong-token" } },
      makeEnv(env),
    );
    expect(res.status).toBe(403);
  });

  it("authz: SYNC_ADMIN_TOKEN 未設定は 500", async () => {
    const app = makeApp(env);
    const res = await app.request(
      "/sync/schema",
      { method: "POST", headers: { Authorization: "Bearer x" } },
      { ...makeEnv(env), SYNC_ADMIN_TOKEN: undefined },
    );
    expect(res.status).toBe(500);
  });

  it(
    "AC-5: admin Bearer 一致で 200 / response が { ok, jobId, status, ... }",
    async () => {
      const app = makeApp(env);
      const res = await app.request(
        "/sync/schema",
        { method: "POST", headers: { Authorization: "Bearer admin-token-x" } },
        makeEnv(env),
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.ok).toBe(true);
      expect(typeof body.jobId).toBe("string");
      expect(body.status).toBe("succeeded");
      expect(body.upserted).toBe(31);
    },
    30000,
  );

  it("AC-6: 同種 running があれば 409", async () => {
    await syncJobs.start(env.ctx, "schema_sync");
    const app = makeApp(env);
    const res = await app.request(
      "/sync/schema",
      { method: "POST", headers: { Authorization: "Bearer admin-token-x" } },
      makeEnv(env),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("conflict");
  });
});
