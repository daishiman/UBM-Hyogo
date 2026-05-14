// UT-17 T7: alert-relay route 統合テスト
import { describe, it, expect, vi } from "vitest";
import { createAlertRelayRoute } from "../alert-relay";
import worker from "../../../index";

const SECRET = "test-secret";
const SLACK_URL = "https://hooks.slack.com/services/T/B/X";

const buildEnv = (
  overrides: Partial<{
    SLACK_WEBHOOK_URL: string;
    CF_WEBHOOK_AUTH_SECRET: string;
    CF_ALERT_DASHBOARD_URL: string;
    CF_ALERT_RUNBOOK_URL: string;
  }> = {},
) => ({
  CF_WEBHOOK_AUTH_SECRET: SECRET,
  SLACK_WEBHOOK_URL: SLACK_URL,
  ...overrides,
});

const headers = (auth: string | null = SECRET) => {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (auth !== null) h["cf-webhook-auth"] = auth;
  return h;
};

describe("createAlertRelayRoute", () => {
  it("ROUTE-01: cf-webhook-auth 不正は 401", async () => {
    const fetchMock = vi.fn();
    const app = createAlertRelayRoute({ fetch: fetchMock as unknown as typeof fetch });
    const res = await app.request(
      "/",
      { method: "POST", headers: headers("wrong"), body: "{}" },
      buildEnv(),
    );
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ROUTE-02: 不正 JSON は 400", async () => {
    const app = createAlertRelayRoute({ fetch: vi.fn() as unknown as typeof fetch });
    const res = await app.request(
      "/",
      { method: "POST", headers: headers(), body: "not-json" },
      buildEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("ROUTE-03: SLACK_WEBHOOK_URL 未設定は 503", async () => {
    const app = createAlertRelayRoute({ fetch: vi.fn() as unknown as typeof fetch });
    const res = await app.request(
      "/",
      { method: "POST", headers: headers(), body: JSON.stringify({ name: "x" }) },
      { CF_WEBHOOK_AUTH_SECRET: SECRET },
    );
    expect(res.status).toBe(503);
  });

  it("ROUTE-04: 正常 payload + Slack 200 で 200 / ok=true", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      dashboardUrl: "https://dash.cloudflare.com/x",
      runbookUrl: "https://example.test/runbook",
    });
    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: "Workers Daily Requests Approaching Limit",
          data: { current: 80000, threshold: 100000 },
          severity: "warning",
        }),
      },
      buildEnv(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; attempts: number };
    expect(body).toMatchObject({ ok: true, attempts: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0]?.[0];
    expect(calledUrl).toBe(SLACK_URL);
  });

  it("ROUTE-04b: env の Dashboard / runbook URL を Slack message に含める", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });
    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: "Workers Daily Requests Approaching Limit",
          data: { current: 80000, threshold: 100000 },
        }),
      },
      {
        ...buildEnv(),
        CF_ALERT_DASHBOARD_URL: "https://dash.cloudflare.com/example",
        CF_ALERT_RUNBOOK_URL: "https://example.test/runbook",
      },
    );
    expect(res.status).toBe(200);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(String(init?.body)).toContain("https://dash.cloudflare.com/example");
    expect(String(init?.body)).toContain("https://example.test/runbook");
  });

  it("ROUTE-05: Slack 5xx 連続で 502", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 503 }));
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      maxRetries: 3,
    });
    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "test", data: {} }),
      },
      buildEnv(),
    );
    expect(res.status).toBe(502);
    const body = (await res.json()) as { ok: boolean; attempts: number };
    expect(body.ok).toBe(false);
    expect(body.attempts).toBe(3);
    expect(JSON.stringify(body)).not.toContain(SLACK_URL);
    expect(JSON.stringify(body)).not.toContain("hooks.slack.com");
  });

  it("ROUTE-05b: 同一 alert は 5 分間 dedup して Slack へ再送しない", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    const request = {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name: "Workers Daily Requests Approaching Limit",
        policy_id: "policy-workers",
        ts: 1_715_000_000_000,
      }),
    };
    const first = await app.request("/", request, buildEnv());
    const second = await app.request("/", request, buildEnv());
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ ok: true, deduped: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ROUTE-06: cf-webhook-auth header 欠落は 401", async () => {
    const app = createAlertRelayRoute();
    const res = await app.request(
      "/",
      { method: "POST", headers: headers(null), body: "{}" },
      buildEnv(),
    );
    expect(res.status).toBe(401);
  });

  it("ROUTE-07: CF_WEBHOOK_AUTH_SECRET 未設定は 500", async () => {
    const app = createAlertRelayRoute();
    const res = await app.request(
      "/",
      { method: "POST", headers: headers(), body: "{}" },
      { SLACK_WEBHOOK_URL: SLACK_URL },
    );
    expect(res.status).toBe(500);
  });
});

describe("mounted /internal/alert-relay", () => {
  it("INDEX-01: apps/api index から mounted route に到達する", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const res = await worker.fetch(
        new Request("https://api.example.test/internal/alert-relay", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ name: "Workers Daily Requests Approaching Limit" }),
        }),
        buildEnv() as never,
        {} as never,
      );
      expect(res.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
