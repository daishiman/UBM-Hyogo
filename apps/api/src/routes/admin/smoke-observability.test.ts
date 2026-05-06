import { describe, expect, it, vi } from "vitest";
import { createSmokeObservabilityRoute } from "./smoke-observability";

const TOKEN = "smoke-token";
const SENTRY_DSN = ["https://public-key@sentry.example.com", "12345"].join("/");
const SLACK_WEBHOOK =
  "https://hooks.slack.com" +
  "/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX";

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
  it("production 環境では 404 を返す", async () => {
    const app = createSmokeObservabilityRoute({ fetchImpl: makeFetch() });
    const res = await app.request(
      "/",
      { method: "POST", headers: { authorization: `Bearer ${TOKEN}` } },
      buildEnv({ ENVIRONMENT: "production" }),
    );
    expect(res.status).toBe(404);
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
});
