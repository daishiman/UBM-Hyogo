import { Hono } from "hono";
import { integrationRuntimeTarget } from "@ubm-hyogo/integrations";
import { describeRuntimeFoundation, runtimeFoundation } from "@ubm-hyogo/shared";
import { adminSyncRoute } from "./routes/admin/sync";
import { runSync, type SyncEnv } from "./jobs/sync-sheets-to-d1";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

interface Env extends SyncEnv {
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly SYNC_ADMIN_TOKEN?: string;
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
    _event: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(runSync(env, { trigger: "cron" }));
  },
};
