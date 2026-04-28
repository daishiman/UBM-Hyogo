import { Hono } from "hono";
import { integrationRuntimeTarget } from "@ubm-hyogo/integrations";
import { describeRuntimeFoundation, runtimeFoundation } from "@ubm-hyogo/shared";
import { adminSyncRoute } from "./routes/admin/sync";
import {
  adminSyncSchemaRoute,
  makeDefaultSchemaSyncDeps,
} from "./routes/admin/sync-schema";
import { runSync, type SyncEnv } from "./jobs/sync-sheets-to-d1";
import { runSchemaSync, ConflictError } from "./sync/schema";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

interface Env extends SyncEnv {
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly SYNC_ADMIN_TOKEN?: string;
  readonly GOOGLE_FORM_ID?: string;
  readonly GOOGLE_FORM_RESPONDER_URL?: string;
  readonly GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  readonly GOOGLE_PRIVATE_KEY?: string;
  readonly FORMS_SA_EMAIL?: string;
  readonly FORMS_SA_KEY?: string;
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

app.get("/me/healthz", (c) => c.json({ ok: true, scope: "me" }));

app.get("/admin/healthz", (c) => c.json({ ok: true, scope: "admin" }));

app.route("/admin", adminSyncRoute);
// 03a: schema 同期 endpoint（POST /admin/sync/schema）
app.route("/admin", adminSyncSchemaRoute);

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
    // 03a: 03:00 JST (= 18:00 UTC) の cron で schema sync を 1 日 1 回実行する。
    // ScheduledController に cron 文字列が来る環境では分岐する。
    const cron = (event as ScheduledController & { cron?: string }).cron ?? "";
    if (cron === "0 18 * * *") {
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
