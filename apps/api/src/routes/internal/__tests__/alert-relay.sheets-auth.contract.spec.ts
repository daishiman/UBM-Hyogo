// UT-25-DERIV-02: alert-relay の sheets-auth payload 拡張 contract test。
import { describe, it, expect, vi } from "vitest";
import { createAlertRelayRoute } from "../alert-relay";
import { createKvStub } from "../../../../test/helpers/kv-stub";

const SECRET = "test-secret";
const SLACK_URL = "https://hooks.slack.com/services/T/B/X";

function buildEnv() {
  const kv = createKvStub();
  return {
    env: {
      CF_WEBHOOK_AUTH_SECRET: SECRET,
      SLACK_WEBHOOK_URL: SLACK_URL,
      ALERT_DEDUP_KV: kv.kv,
    } as Record<string, unknown>,
    kv,
  };
}

function buildEnvWithoutKv() {
  return {
    CF_WEBHOOK_AUTH_SECRET: SECRET,
    SLACK_WEBHOOK_URL: SLACK_URL,
  } as Record<string, unknown>;
}

const headers = { "content-type": "application/json", "cf-webhook-auth": SECRET };

const samplePayload = (overrides: Record<string, unknown> = {}) => ({
  category: "sheets-auth",
  code: "SHEETS_AUTH_401_KEY_INVALID",
  status: 401,
  message: "unauthorized",
  jobName: "sheets-auth-healthcheck",
  spreadsheetId: "sheet-id",
  ts: "2026-05-22T18:00:00.000Z",
  ...overrides,
});

describe("alert-relay sheets-auth payload", () => {
  it("category=sheets-auth を受理して 200 を返す & Slack 1 回 POST", async () => {
    const { env } = buildEnv();
    const fetchSpy = vi.fn(async () => new Response("ok", { status: 200 }));
    const app = createAlertRelayRoute({ fetch: fetchSpy as unknown as typeof fetch });
    const res = await app.request(
      "/",
      { method: "POST", headers, body: JSON.stringify(samplePayload()) },
      env,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calls = fetchSpy.mock.calls as unknown as Array<[unknown, RequestInit]>;
    const body = JSON.parse(String(calls[0]![1].body));
    expect(body.text).toContain("SHEETS_AUTH_401_KEY_INVALID");
  });

  it("ALERT_DEDUP_KV 未設定でも sheets-auth alert を fail-open で送信する", async () => {
    const fetchSpy = vi.fn(async () => new Response("ok", { status: 200 }));
    const app = createAlertRelayRoute({ fetch: fetchSpy as unknown as typeof fetch });
    const res = await app.request(
      "/",
      { method: "POST", headers, body: JSON.stringify(samplePayload()) },
      buildEnvWithoutKv(),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, dedupPersisted: false });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("dedup KV キーが alert:sheets-auth:<code>:<window> 形式で書かれる", async () => {
    const { env, kv } = buildEnv();
    const fetchSpy = vi.fn(async () => new Response("ok", { status: 200 }));
    const app = createAlertRelayRoute({ fetch: fetchSpy as unknown as typeof fetch });
    await app.request(
      "/",
      { method: "POST", headers, body: JSON.stringify(samplePayload()) },
      env,
    );
    const writtenKeys = Array.from(kv.store.keys());
    expect(writtenKeys.length).toBe(1);
    expect(writtenKeys[0]).toMatch(/^alert:sheets-auth:SHEETS_AUTH_401_KEY_INVALID:\d+$/);
  });

  it("同一 10 分窓内の 3 回目以降は dedup されて Slack 送信 skip", async () => {
    const { env } = buildEnv();
    const fetchSpy = vi.fn(async () => new Response("ok", { status: 200 }));
    const app = createAlertRelayRoute({ fetch: fetchSpy as unknown as typeof fetch });
    const payload = samplePayload();
    await app.request("/", { method: "POST", headers, body: JSON.stringify(payload) }, env);
    const second = await app.request(
      "/",
      { method: "POST", headers, body: JSON.stringify(payload) },
      env,
    );
    expect((await second.json()) as { ok: boolean }).toMatchObject({ ok: true });
    const res = await app.request(
      "/",
      { method: "POST", headers, body: JSON.stringify(payload) },
      env,
    );
    const json = (await res.json()) as { ok: boolean; deduped?: boolean };
    expect(json.deduped).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
