// 09b-A: Sentry / Slack runtime smoke route。dev/staging 限定。
//
// Security:
// - production returns 404.
// - SMOKE_ADMIN_TOKEN Bearer auth is required.
// - DSN URLs, Slack webhook URLs, token values, and value hashes are never returned.

import { Hono } from "hono";

export interface SmokeObservabilityEnv {
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly SMOKE_ADMIN_TOKEN?: string;
  readonly SENTRY_DSN_API?: string;
  readonly SLACK_WEBHOOK_INCIDENT?: string;
}

export interface SmokeObservabilityDeps {
  fetchImpl?: typeof fetch;
  now?: () => Date;
  eventId?: () => string;
}

type SmokeTarget = "sentry" | "slack" | "both";

interface SentryDsnParts {
  readonly endpoint: string;
  readonly envelopeDsn: string;
  readonly publicKey: string;
  readonly projectId: string;
}

const DEFAULT_TARGET: SmokeTarget = "both";
const DEFAULT_FETCH = fetch;

export function createSmokeObservabilityRoute(
  deps: SmokeObservabilityDeps = {},
) {
  const app = new Hono<{ Bindings: SmokeObservabilityEnv }>();
  const fetchImpl = deps.fetchImpl ?? DEFAULT_FETCH;
  const now = deps.now ?? (() => new Date());
  const eventId = deps.eventId ?? (() => crypto.randomUUID().replace(/-/g, ""));

  app.post("/", async (c) => {
    if (c.env.ENVIRONMENT === "production") {
      return c.notFound();
    }

    const expected = c.env.SMOKE_ADMIN_TOKEN;
    const auth = c.req.header("authorization") ?? "";
    if (!expected || auth !== `Bearer ${expected}`) {
      return c.json({ ok: false, error: "unauthorized" } as const, 401);
    }

    const target = parseTarget(c.req.query("target"));
    if (!target) {
      return c.json(
        {
          ok: false,
          errorCode: "INVALID_TARGET",
          message: "target must be sentry, slack, or both",
        } as const,
        400,
      );
    }

    const timestamp = now().toISOString();
    const smokeId = eventId().slice(0, 32);
    const result: {
      sentry?: ProviderSmokeResult;
      slack?: ProviderSmokeResult;
    } = {};

    if (target === "sentry" || target === "both") {
      result.sentry = await sendSentrySmoke({
        dsn: c.env.SENTRY_DSN_API,
        envName: c.env.ENVIRONMENT ?? "unknown",
        fetchImpl,
        smokeId,
        timestamp,
      });
    }

    if (target === "slack" || target === "both") {
      result.slack = await sendSlackSmoke({
        webhookUrl: c.env.SLACK_WEBHOOK_INCIDENT,
        envName: c.env.ENVIRONMENT ?? "unknown",
        fetchImpl,
        smokeId,
        timestamp,
      });
    }

    const ok = Object.values(result).every((r) => r.ok);
    return c.json(
      {
        ok,
        env: c.env.ENVIRONMENT ?? "unknown",
        smokeId,
        timestamp,
        ...result,
      },
      ok ? 200 : 502,
    );
  });

  return app;
}

interface ProviderSmokeResult {
  readonly ok: boolean;
  readonly status?: number;
  readonly evidence: string;
  readonly errorCode?:
    | "CONFIG_MISSING"
    | "CONFIG_INVALID"
    | "UPSTREAM_ERROR"
    | undefined;
}

async function sendSentrySmoke(input: {
  readonly dsn: string | undefined;
  readonly envName: string;
  readonly fetchImpl: typeof fetch;
  readonly smokeId: string;
  readonly timestamp: string;
}): Promise<ProviderSmokeResult> {
  if (!input.dsn) {
    return {
      ok: false,
      errorCode: "CONFIG_MISSING",
      evidence: "SENTRY_DSN_API missing",
    };
  }

  const parsed = parseSentryDsn(input.dsn);
  if (!parsed) {
    return {
      ok: false,
      errorCode: "CONFIG_INVALID",
      evidence: "SENTRY_DSN_API invalid",
    };
  }

  const envelope = buildSentryEnvelope({
    dsn: parsed,
    envName: input.envName,
    smokeId: input.smokeId,
    timestamp: input.timestamp,
  });
  const response = await input.fetchImpl(parsed.endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-sentry-envelope" },
    body: envelope,
  });

  return {
    ok: response.ok,
    status: response.status,
    errorCode: response.ok ? undefined : "UPSTREAM_ERROR",
    evidence: `sentry event_id=${input.smokeId.slice(0, 8)} status=${response.status}`,
  };
}

async function sendSlackSmoke(input: {
  readonly webhookUrl: string | undefined;
  readonly envName: string;
  readonly fetchImpl: typeof fetch;
  readonly smokeId: string;
  readonly timestamp: string;
}): Promise<ProviderSmokeResult> {
  if (!input.webhookUrl) {
    return {
      ok: false,
      errorCode: "CONFIG_MISSING",
      evidence: "SLACK_WEBHOOK_INCIDENT missing",
    };
  }
  if (!isSlackWebhookUrl(input.webhookUrl)) {
    return {
      ok: false,
      errorCode: "CONFIG_INVALID",
      evidence: "SLACK_WEBHOOK_INCIDENT invalid",
    };
  }

  const response = await input.fetchImpl(input.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      text: `[${input.envName.toUpperCase()} SMOKE] UBM observability test ${input.timestamp}`,
      metadata: {
        event_type: "ubm_observability_smoke",
        event_payload: {
          smoke_id: input.smokeId.slice(0, 8),
          env: input.envName,
        },
      },
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    errorCode: response.ok ? undefined : "UPSTREAM_ERROR",
    evidence: `slack status=${response.status}`,
  };
}

function parseTarget(raw: string | undefined): SmokeTarget | null {
  if (!raw) return DEFAULT_TARGET;
  if (raw === "sentry" || raw === "slack" || raw === "both") return raw;
  return null;
}

function parseSentryDsn(dsn: string): SentryDsnParts | null {
  try {
    const url = new URL(dsn);
    if (url.protocol !== "https:" || !url.username) return null;
    const projectId = url.pathname.split("/").filter(Boolean).at(-1);
    if (!projectId) return null;
    return {
      endpoint: `${url.origin}/api/${projectId}/envelope/`,
      envelopeDsn: `${url.protocol}//${url.username}@${url.host}${url.pathname}`,
      publicKey: url.username,
      projectId,
    };
  } catch {
    return null;
  }
}

function buildSentryEnvelope(input: {
  readonly dsn: SentryDsnParts;
  readonly envName: string;
  readonly smokeId: string;
  readonly timestamp: string;
}): string {
  const event = {
    event_id: input.smokeId,
    timestamp: input.timestamp,
    platform: "javascript",
    level: "info",
    environment: input.envName,
    message: `UBM staging smoke ${input.timestamp}`,
    tags: { smoke: "09b-A", source: "admin-smoke-observability" },
  };
  return [
    JSON.stringify({
      event_id: input.smokeId,
      sent_at: input.timestamp,
      dsn: input.dsn.envelopeDsn,
      sdk: { name: "ubm-hyogo-worker-smoke", version: "1.0.0" },
    }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
    "",
  ].join("\n");
}

function isSlackWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "hooks.slack.com" &&
      url.pathname.startsWith("/services/")
    );
  } catch {
    return false;
  }
}
