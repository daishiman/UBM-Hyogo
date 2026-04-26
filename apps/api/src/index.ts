import { Hono } from "hono";
import { integrationRuntimeTarget } from "@ubm-hyogo/integrations";
import { describeRuntimeFoundation, runtimeFoundation } from "@ubm-hyogo/shared";

interface Env {
  readonly ENVIRONMENT: "production" | "staging" | "development";
  readonly DB: D1Database;
}

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

export default app;
