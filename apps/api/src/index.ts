import { Hono } from "hono";
import {
  createGoogleFormsClient,
  integrationRuntimeTarget,
  type JwtSigner,
  type GoogleFormsClient,
} from "@ubm-hyogo/integrations";
import { describeRuntimeFoundation, runtimeFoundation } from "@ubm-hyogo/shared";
import { adminSyncRoute } from "./routes/admin/sync";
import { createAdminResponsesSyncRoute } from "./routes/admin/responses-sync";
import {
  adminSyncSchemaRoute,
  makeDefaultSchemaSyncDeps,
} from "./routes/admin/sync-schema";
import { ctx } from "./repository/_shared/db";
import { listFieldsByVersion } from "./repository/schemaQuestions";
import { runSync, type SyncEnv } from "./jobs/sync-sheets-to-d1";
import {
  runResponseSync,
  type ResponseSyncEnv,
} from "./jobs/sync-forms-responses";
import { runSchemaSync, ConflictError } from "./sync/schema";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { createPublicRouter } from "./routes/public";
import { createMeRoute } from "./routes/me";

interface Env extends SyncEnv, ResponseSyncEnv {
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly SYNC_ADMIN_TOKEN?: string;
  readonly FORM_ID?: string;
  readonly GOOGLE_FORM_ID?: string;
  readonly GOOGLE_FORM_RESPONDER_URL?: string;
  readonly GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  readonly GOOGLE_PRIVATE_KEY?: string;
  readonly FORMS_SA_EMAIL?: string;
  readonly FORMS_SA_KEY?: string;
}

const textEncoder = new TextEncoder();

function base64UrlEncode(input: string | ArrayBuffer): string {
  const bytes =
    typeof input === "string"
      ? textEncoder.encode(input)
      : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function privateKeyToDer(privateKey: string): ArrayBuffer {
  const normalized = privateKey.replace(/\\n/g, "\n");
  const pemBody = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(pemBody);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const webCryptoJwtSigner: JwtSigner = {
  async sign(header, payload, privateKey) {
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyToDer(privateKey),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      textEncoder.encode(signingInput),
    );
    return `${signingInput}.${base64UrlEncode(signature)}`;
  },
};

function buildFormsClient(env: Env): GoogleFormsClient {
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY が未設定です",
    );
  }
  return createGoogleFormsClient(
    {
      FORMS_SA_EMAIL: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      FORMS_SA_KEY: env.GOOGLE_PRIVATE_KEY,
    },
    {
      authDeps: { fetchImpl: fetch, signer: webCryptoJwtSigner },
      questionIdToStableKey: async (raw) => {
        const rows = await listFieldsByVersion(
          ctx({ DB: env.DB }),
          env.GOOGLE_FORM_ID ?? env.FORM_ID ?? "",
          raw.revisionId ?? "unknown",
        );
        return Object.fromEntries(
          rows
            .filter((row) => row.questionId)
            .map((row) => [row.questionId as string, row.stableKey]),
        );
      },
    },
  );
}

const app = new Hono<{ Bindings: Env }>();

app.notFound(notFoundHandler);
app.onError(errorHandler);

app.get("/", (c) =>
  c.json({
    service: "ubm-hyogo-api",
    environment: c.env.ENVIRONMENT,
    runtime: runtimeFoundation.apiRuntime,
  }),
);

app.get("/healthz", (c) => c.json({ ok: true }));

app.get("/public/healthz", (c) => c.json({ ok: true, scope: "public" }));

// 04a: 公開ディレクトリ API (4 endpoint)
// session middleware を適用しない (AC-9 / 不変条件 #5 公開境界)
app.route("/public", createPublicRouter());

app.get("/me/healthz", (c) => c.json({ ok: true, scope: "me" }));

// 04b: /me/* member self-service。
// session resolver は 05a/b で Auth.js provider 連携時に差し替える。
// 現状は MVP として x-ubm-dev-session: 1 付きの dev request に限り、
// Bearer "session:<email>:<memberId>" 形式の dev token を許容する。
// 本ヘッダは 05a/b で Auth.js cookie ベースの resolver に置き換える。
app.route(
  "/me",
  createMeRoute({
    resolveSession: async (req, env) => {
      if (env?.ENVIRONMENT && env.ENVIRONMENT !== "development") return null;
      if (req.headers.get("x-ubm-dev-session") !== "1") return null;
      const auth = req.headers.get("authorization") ?? "";
      const m = /^Bearer\s+session:([^:]+):(.+)$/.exec(auth);
      if (!m) return null;
      const [, email, memberId] = m;
      if (!email || !memberId) return null;
      return { email, memberId };
    },
  }),
);

app.get("/admin/healthz", (c) => c.json({ ok: true, scope: "admin" }));

app.route("/admin", adminSyncRoute);
// 03a: schema 同期 endpoint（POST /admin/sync/schema）
app.route("/admin", adminSyncSchemaRoute);
// 03b: response 同期 endpoint（POST /admin/sync/responses）
app.route(
  "/admin",
  createAdminResponsesSyncRoute({ buildClient: buildFormsClient }),
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    foundation: describeRuntimeFoundation(),
    integrationRuntimeTarget,
  }),
);

export default {
  fetch: app.fetch,
  async scheduled(
    event: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const cron = (event as ScheduledController & { cron?: string }).cron ?? "";
    if (cron === "*/15 * * * *") {
      // 03b: 15 分毎の forms response 同期
      try {
        const client = buildFormsClient(env);
        ctx.waitUntil(runResponseSync(env, { trigger: "cron", client }));
      } catch (_err) {
        // GOOGLE secret 未設定など: cron 単位では fail させずスキップ
      }
      return;
    }
    if (cron === "0 18 * * *") {
      // 03a: 03:00 JST (= 18:00 UTC) の cron で schema sync を 1 日 1 回実行する。
      ctx.waitUntil(
        (async () => {
          try {
            const deps = makeDefaultSchemaSyncDeps(env);
            await runSchemaSync(env, deps);
          } catch (e) {
            // 同種 running は cron 経路では sink して次回 retry に任せる
            if (e instanceof ConflictError) return;
            // Secret 未設定などの SyncIntegrityError は環境整備後の次回実行に任せる。
            // その他は sync_jobs.error に記録済みのため throw しない。
          }
        })(),
      );
      return;
    }
    ctx.waitUntil(runSync(env, { trigger: "cron" }));
  },
};
