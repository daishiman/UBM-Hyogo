import { describe, expect, it, vi } from "vitest";
import {
  PRODUCTION_CONFIRM_HEADER,
  PRODUCTION_CONFIRM_VALUE,
  createSmokeObservabilityRoute,
  smokeMessagePrefix,
} from "./smoke-observability";

const TOKEN = "smoke-token";
const SENTRY_DSN = ["https://public-key@sentry.example.com", "12345"].join("/");
const SLACK_WEBHOOK_HOST = ["hooks", "slack", "com"].join(".");
const SLACK_WEBHOOK = new URL(
  "/services/t00000000/b00000000/xxxxxxxxxxxxxxxxxxxxxxxx",
  `https://${SLACK_WEBHOOK_HOST}`,
).toString();

function buildEnv(overrides: Record<string, unknown> = {}) {
  return {
    ENVIRONMENT: "staging" as const,
    SMOKE_ADMIN_TOKEN: TOKEN,
    SENTRY_DSN_API: SENTRY_DSN,
    SLACK_WEBHOOK_INCIDENT: SLACK_WEBHOOK,
    ...overrides,
  };
}

function makeFetch(status = 200) {
  return vi.fn(
    async (_input: Parameters<typeof fetch>[0], _init?: Parameters<typeof fetch>[1]) =>
      new Response("ok", { status }),
  );
}

describe("createSmokeObservabilityRoute", () => {
  it("production 環境では confirmation header なしで 403 を返す", async () => {
    const fetchImpl = makeFetch();
    const app = createSmokeObservabilityRoute({ fetchImpl });
    const res = await app.request(
      "/",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      buildEnv({ ENVIRONMENT: "production" }),
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      ok: false,
      errorCode: "PRODUCTION_CONFIRM_REQUIRED",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("production 環境では confirmation header 付きで provider smoke を実行する", async () => {
    const fetchImpl = makeFetch();
    const app = createSmokeObservabilityRoute({
      fetchImpl,
      now: () => new Date("2026-05-05T00:00:00.000Z"),
      eventId: () => "abcdef1234567890abcdef1234567890",
    });
    const res = await app.request(
      "/?target=both",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${TOKEN}`,
          [PRODUCTION_CONFIRM_HEADER]: PRODUCTION_CONFIRM_VALUE,
        },
      },
      buildEnv({ ENVIRONMENT: "production" }),
    );
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const sentryBody = String(fetchImpl.mock.calls[0]?.[1]?.body);
    const slackBody = String(fetchImpl.mock.calls[1]?.[1]?.body);
    expect(sentryBody).toContain("UBM production smoke");
    expect(sentryBody).toContain('"environment":"production"');
    expect(slackBody).toContain("[PRODUCTION SMOKE]");
    const bodyText = await res.text();
    expect(bodyText).toContain('"env":"production"');
    expect(bodyText).not.toContain(SENTRY_DSN);
    expect(bodyText).not.toContain(SLACK_WEBHOOK);
    expect(bodyText).not.toContain(TOKEN);
  });

  it("production 環境では confirmation header があっても認証を先に検査する", async () => {
    const fetchImpl = makeFetch();
    const app = createSmokeObservabilityRoute({ fetchImpl });
    const res = await app.request(
      "/?target=both",
      {
        method: "POST",
        headers: {
          authorization: "Bearer wrong-token",
          [PRODUCTION_CONFIRM_HEADER]: PRODUCTION_CONFIRM_VALUE,
        },
      },
      buildEnv({ ENVIRONMENT: "production" }),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ ok: false, error: "unauthorized" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("Authorization ヘッダなしで 401", async () => {
    const app = createSmokeObservabilityRoute({ fetchImpl: makeFetch() });
    const res = await app.request("/", { method: "POST" }, buildEnv());
    expect(res.status).toBe(401);
  });

  it("target が不正なら 400", async () => {
    const app = createSmokeObservabilityRoute({ fetchImpl: makeFetch() });
    const res = await app.request(
      "/?target=bad",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      buildEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("Sentry smoke は envelope endpoint に送信し、レスポンスに DSN を含めない", async () => {
    const fetchImpl = makeFetch();
    const app = createSmokeObservabilityRoute({
      fetchImpl,
      now: () => new Date("2026-05-05T00:00:00.000Z"),
      eventId: () => "abcdef1234567890abcdef1234567890",
    });
    const res = await app.request(
      "/?target=sentry",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      buildEnv(),
    );
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://sentry.example.com/api/12345/envelope/");
    expect(String(init?.body)).toContain("UBM staging smoke");
    expect(String(init?.body)).toContain(SENTRY_DSN);
    const bodyText = await res.text();
    expect(bodyText).toContain("abcdef12");
    expect(bodyText).not.toContain(SENTRY_DSN);
    expect(bodyText).not.toContain("public-key");
  });

  it("Slack smoke は webhook に送信し、レスポンスに webhook URL を含めない", async () => {
    const fetchImpl = makeFetch();
    const app = createSmokeObservabilityRoute({
      fetchImpl,
      now: () => new Date("2026-05-05T00:00:00.000Z"),
      eventId: () => "abcdef1234567890abcdef1234567890",
    });
    const res = await app.request(
      "/?target=slack",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      buildEnv(),
    );
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(SLACK_WEBHOOK);
    expect(String(init?.body)).toContain("[STAGING SMOKE]");
    const bodyText = await res.text();
    expect(bodyText).toContain("slack status=200");
    expect(bodyText).not.toContain(SLACK_WEBHOOK);
  });

  it("Slack upstream error でも webhook URL と token をレスポンスに含めない", async () => {
    const app = createSmokeObservabilityRoute({ fetchImpl: makeFetch(500) });
    const res = await app.request(
      "/?target=slack",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      buildEnv(),
    );
    expect(res.status).toBe(502);
    const bodyText = await res.text();
    expect(bodyText).toContain("UPSTREAM_ERROR");
    expect(bodyText).not.toContain(SLACK_WEBHOOK);
    expect(bodyText).not.toContain(SLACK_WEBHOOK_HOST);
    expect(bodyText).not.toContain(TOKEN);
  });

  it("secret 未設定は 502 で CONFIG_MISSING を返す", async () => {
    const app = createSmokeObservabilityRoute({ fetchImpl: makeFetch() });
    const res = await app.request(
      "/?target=both",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      buildEnv({
        SENTRY_DSN_API: undefined,
        SLACK_WEBHOOK_INCIDENT: undefined,
      }),
    );
    expect(res.status).toBe(502);
    const body = (await res.json()) as {
      sentry: { errorCode: string };
      slack: { errorCode: string };
    };
    expect(body.sentry.errorCode).toBe("CONFIG_MISSING");
    expect(body.slack.errorCode).toBe("CONFIG_MISSING");
  });

  it("upstream 失敗は 502 で UPSTREAM_ERROR を返す", async () => {
    const app = createSmokeObservabilityRoute({ fetchImpl: makeFetch(500) });
    const res = await app.request(
      "/?target=slack",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      buildEnv(),
    );
    expect(res.status).toBe(502);
    const body = (await res.json()) as { slack: { errorCode: string } };
    expect(body.slack.errorCode).toBe("UPSTREAM_ERROR");
  });

  it("fetch が reject しても 502 で UPSTREAM_ERROR を返す", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network failed");
    });
    const app = createSmokeObservabilityRoute({ fetchImpl });
    const res = await app.request(
      "/?target=both",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      buildEnv(),
    );
    expect(res.status).toBe(502);
    const body = (await res.json()) as {
      sentry: { errorCode: string; evidence: string };
      slack: { errorCode: string; evidence: string };
    };
    expect(body.sentry).toMatchObject({
      errorCode: "UPSTREAM_ERROR",
      evidence: "sentry fetch failed",
    });
    expect(body.slack).toMatchObject({
      errorCode: "UPSTREAM_ERROR",
      evidence: "slack fetch failed",
    });
  });

  it("smokeMessagePrefix は environment ごとの prefix を返す", () => {
    expect(smokeMessagePrefix("production")).toBe("[PRODUCTION SMOKE]");
    expect(smokeMessagePrefix("staging")).toBe("[STAGING SMOKE]");
    expect(smokeMessagePrefix(undefined)).toBe("[UNKNOWN SMOKE]");
  });
});
