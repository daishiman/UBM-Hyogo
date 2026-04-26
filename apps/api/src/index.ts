import { Hono } from "hono";
import { integrationRuntimeTarget } from "@ubm-hyogo/integrations";
import { describeRuntimeFoundation, runtimeFoundation } from "@ubm-hyogo/shared";

interface Env {
  readonly ENVIRONMENT?: "production" | "staging" | "development";
}

const app = new Hono<{ Bindings: Env }>();

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

app.get("/health", (c) =>
  c.json({
    ok: true,
    foundation: describeRuntimeFoundation(),
    integrationRuntimeTarget,
  }),
);

export default {
  fetch: app.fetch,
};
