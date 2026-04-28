// 03a: POST /admin/sync/schema
// AC-5 / AC-6: sync_jobs running -> succeeded/failed の遷移と 同種 running の 409 を expose する。
import { Hono } from "hono";
import { adminGate, type AdminGateEnv } from "../../middleware/admin-gate";
import { createGoogleFormsClient } from "@ubm-hyogo/integrations-google";
import {
  runSchemaSync,
  ConflictError,
  SyncIntegrityError,
  ctxFromEnv,
  type SchemaSyncDeps,
} from "../../sync/schema";
interface AdminSyncSchemaEnv extends AdminGateEnv {
  readonly DB: D1Database;
  readonly GOOGLE_FORM_ID?: string;
  readonly GOOGLE_FORM_RESPONDER_URL?: string;
  readonly GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  readonly GOOGLE_PRIVATE_KEY?: string;
  readonly FORMS_SA_EMAIL?: string;
  readonly FORMS_SA_KEY?: string;
}

const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const base64UrlJson = (value: unknown): string =>
  base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));

const pemToPkcs8 = (pem: string): ArrayBuffer => {
  const normalized = pem.replace(/\\n/g, "\n");
  const body = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};

const serviceAccountSigner = {
  async sign(
    header: Record<string, unknown>,
    payload: Record<string, unknown>,
    privateKey: string,
  ): Promise<string> {
    const signingInput = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
    const key = await crypto.subtle.importKey(
      "pkcs8",
      pemToPkcs8(privateKey),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      new TextEncoder().encode(signingInput),
    );
    return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
  },
};

/**
 * 本番 deps factory。
 * 既存の `FORMS_SA_*` と 03a の `GOOGLE_*` の両方を受け、移行中の env 名揺れを吸収する。
 */
export const makeDefaultSchemaSyncDeps = (env: AdminSyncSchemaEnv): SchemaSyncDeps => {
  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? env.FORMS_SA_EMAIL;
  const key = env.GOOGLE_PRIVATE_KEY ?? env.FORMS_SA_KEY;
  if (!email || !key) {
    throw new SyncIntegrityError(
      "Google Forms service account env is not configured",
    );
  }
  return {
    ctx: ctxFromEnv(env),
    formsClient: createGoogleFormsClient(
      { FORMS_SA_EMAIL: email, FORMS_SA_KEY: key },
      { authDeps: { signer: serviceAccountSigner } },
    ),
  };
};

export type SchemaSyncDepsFactory = (env: AdminSyncSchemaEnv) => SchemaSyncDeps;

/**
 * Route factory: deps factory を注入できるようにしてテストを容易にする。
 */
export const createAdminSyncSchemaRoute = (
  depsFactory: SchemaSyncDepsFactory = makeDefaultSchemaSyncDeps,
) => {
  const app = new Hono<{ Bindings: AdminSyncSchemaEnv }>();
  app.post("/sync/schema", adminGate, async (c) => {
    let deps: SchemaSyncDeps;
    try {
      deps = depsFactory(c.env);
    } catch (e) {
      if (e instanceof SyncIntegrityError) {
        return c.json({ ok: false, error: e.message }, 500);
      }
      throw e;
    }
    try {
      const result = await runSchemaSync(c.env, deps);
      return c.json(
        {
          ok: true,
          jobId: result.jobId,
          status: result.status,
          revisionId: result.revisionId,
          upserted: result.upserted,
          diffEnqueued: result.diffEnqueued,
        },
        200,
      );
    } catch (e) {
      if (e instanceof ConflictError) {
        return c.json({ ok: false, status: "conflict", error: e.message }, 409);
      }
      const message = e instanceof Error ? e.message : String(e);
      return c.json({ ok: false, status: "failed", error: message }, 500);
    }
  });
  return app;
};

export const adminSyncSchemaRoute = createAdminSyncSchemaRoute();
