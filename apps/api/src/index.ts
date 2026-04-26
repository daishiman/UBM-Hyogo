import { Hono } from "hono";
import { integrationRuntimeTarget } from "@ubm-hyogo/integrations";
import { describeRuntimeFoundation, runtimeFoundation } from "@ubm-hyogo/shared";
import { runBackfill, runSync } from "./sync/worker";
import type { Env } from "./sync/types";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) =>
  c.json({
    service: "ubm-hyogo-api",
    environment: c.env.ENVIRONMENT,
    runtime: runtimeFoundation.apiRuntime,
  }),
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    foundation: describeRuntimeFoundation(),
    integrationRuntimeTarget,
  }),
);

// 手動 sync（管理者操作）
app.post("/sync/manual", async (c) => {
  const result = await runSync(c.env, "manual");
  return c.json(result, result.status === "success" ? 200 : 500);
});

// backfill（全件 truncate-and-reload）
app.post("/sync/backfill", async (c) => {
  const result = await runBackfill(c.env);
  return c.json(result, result.status === "success" ? 200 : 500);
});

// audit ログ確認
app.get("/sync/audit", async (c) => {
  const limit = Number(c.req.query("limit") ?? "20");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM sync_audit ORDER BY started_at DESC LIMIT ?",
  )
    .bind(Math.min(limit, 100))
    .all();
  return c.json(results);
});

export default {
  fetch: app.fetch,

  // Cron trigger（scheduled sync）— wrangler.toml: crons = ["0 * * * *"]
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runSync(env, "scheduled"));
  },
};
