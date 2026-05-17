// UT-17 T7: alert-relay route 統合テスト
// ut-17-followup-002: dedup state を in-memory Map から Cloudflare KV namespace へ移行
import { describe, it, expect, vi } from "vitest";
import { createAlertRelayRoute } from "../alert-relay";
import worker from "../../../index";
import { createKvStub, type KvStub } from "../../../../test/helpers/kv-stub";

const SECRET = "test-secret";
const SLACK_URL = "https://hooks.slack.com/services/T/B/X";

interface BuildEnvOptions {
  readonly SLACK_WEBHOOK_URL?: string;
  readonly CF_WEBHOOK_AUTH_SECRET?: string;
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;
  readonly kv?: KvStub;
  readonly omitSlack?: boolean;
  readonly omitAuthSecret?: boolean;
}

const buildEnv = (overrides: BuildEnvOptions = {}) => {
  const kv = overrides.kv ?? createKvStub();
  const env: Record<string, unknown> = {
    ALERT_DEDUP_KV: kv.kv,
  };
  if (!overrides.omitAuthSecret) {
    env["CF_WEBHOOK_AUTH_SECRET"] = overrides.CF_WEBHOOK_AUTH_SECRET ?? SECRET;
  }
  if (!overrides.omitSlack) {
    env["SLACK_WEBHOOK_URL"] = overrides.SLACK_WEBHOOK_URL ?? SLACK_URL;
  }
  if (overrides.CF_ALERT_DASHBOARD_URL !== undefined) {
    env["CF_ALERT_DASHBOARD_URL"] = overrides.CF_ALERT_DASHBOARD_URL;
  }
  if (overrides.CF_ALERT_RUNBOOK_URL !== undefined) {
    env["CF_ALERT_RUNBOOK_URL"] = overrides.CF_ALERT_RUNBOOK_URL;
  }
  return env;
};

const headers = (auth: string | null = SECRET) => {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (auth !== null) h["cf-webhook-auth"] = auth;
  return h;
};

const parseStructuredWarn = (warnSpy: ReturnType<typeof vi.spyOn>) => {
  const firstArg = warnSpy.mock.calls[0]?.[0];
  expect(typeof firstArg).toBe("string");
  return JSON.parse(firstArg as string) as {
    event: string;
    op: "get" | "put";
    errorClass: string;
    dedupeKeyHash: string;
    isolateId: string;
    ts: string;
  };
};

const parseStructuredWarnAt = (
  warnSpy: ReturnType<typeof vi.spyOn>,
  index: number,
) => {
  const arg = warnSpy.mock.calls[index]?.[0];
  expect(typeof arg).toBe("string");
  return JSON.parse(arg as string) as ReturnType<typeof parseStructuredWarn>;
};

const expectedHash = async (dedupeKey: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(dedupeKey),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
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
      buildEnv({ omitSlack: true }),
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
      buildEnv({
        CF_ALERT_DASHBOARD_URL: "https://dash.cloudflare.com/example",
        CF_ALERT_RUNBOOK_URL: "https://example.test/runbook",
      }),
    );
    expect(res.status).toBe(200);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(String(init?.body)).toContain("https://dash.cloudflare.com/example");
    expect(String(init?.body)).toContain("https://example.test/runbook");
  });

  it("ROUTE-05: Slack 5xx 連続で 502", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 503 }));
    const kv = createKvStub();
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
      buildEnv({ kv }),
    );
    expect(res.status).toBe(502);
    const body = (await res.json()) as { ok: boolean; attempts: number };
    expect(body.ok).toBe(false);
    expect(body.attempts).toBe(3);
    expect(JSON.stringify(body)).not.toContain(SLACK_URL);
    expect(JSON.stringify(body)).not.toContain("hooks.slack.com");
    expect(kv.puts).toHaveLength(0);
  });

  it("ROUTE-05a: Slack 配信失敗後の Cloudflare retry は dedup されず再送を試みる", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    const kv = createKvStub({ now: () => 1_715_000_000_000 });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      maxRetries: 1,
      now: () => 1_715_000_000_000,
    });
    const request = {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name: "Workers Daily Requests Approaching Limit",
        policy_id: "policy-retry-after-slack-failure",
        ts: 1_715_000_000_000,
      }),
    };
    const env = buildEnv({ kv });
    const first = await app.request("/", request, env);
    const second = await app.request("/", request, env);
    expect(first.status).toBe(502);
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ ok: true, attempts: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(kv.puts).toHaveLength(1);
  });

  it("ROUTE-05b / TC-02: 同一 alert は 5 分間 dedup して Slack へ再送しない", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const kv = createKvStub({ now: () => 1_715_000_000_000 });
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
    const env = buildEnv({ kv });
    const first = await app.request("/", request, env);
    const second = await app.request("/", request, env);
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
      buildEnv({ omitAuthSecret: true }),
    );
    expect(res.status).toBe(500);
  });

  it("TC-03: 異なる metric / policy_id / minuteBucket は dedup されない", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const kv = createKvStub({ now: () => 1_715_000_000_000 });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    const env = buildEnv({ kv });
    await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "A", policy_id: "p1", ts: 1_715_000_000_000 }),
      },
      env,
    );
    await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "B", policy_id: "p2", ts: 1_715_000_000_000 }),
      },
      env,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("TC-KV-01: TTL 経過後の再受信は deduped 解除される", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    let nowMs = 1_715_000_000_000;
    const kv = createKvStub({ now: () => nowMs });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => nowMs,
      // dedupeTtlMs default = 5 * 60 * 1000
    });
    const env = buildEnv({ kv });
    const reqBody = JSON.stringify({
      name: "Workers Daily Requests Approaching Limit",
      policy_id: "policy-ttl",
      ts: 1_715_000_000_000,
    });
    const res1 = await app.request(
      "/",
      { method: "POST", headers: headers(), body: reqBody },
      env,
    );
    expect(res1.status).toBe(200);
    // ms: 5 * 60 * 1000 + 1 → TTL 境界超過
    nowMs = 1_715_000_000_000 + 5 * 60 * 1000 + 1;
    const res2 = await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: "Workers Daily Requests Approaching Limit",
          policy_id: "policy-ttl",
          ts: nowMs,
        }),
      },
      env,
    );
    expect(res2.status).toBe(200);
    expect(await res2.json()).toMatchObject({ ok: true, attempts: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("TC-KV-02: KV に put される値は '1' 固定（metadata 不使用）", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const kv = createKvStub({ now: () => 1_715_000_000_000 });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: "X",
          policy_id: "policy-kv02",
          ts: 1_715_000_000_000,
        }),
      },
      buildEnv({ kv }),
    );
    expect(kv.puts).toHaveLength(1);
    expect(kv.puts[0]?.value).toBe("1");
  });

  it("TC-KV-03: expirationTtl が Math.ceil(dedupeTtlMs / 1000) で渡される", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const kv = createKvStub({ now: () => 1_715_000_000_000 });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
      dedupeTtlMs: 123_456, // Math.ceil(123_456 / 1000) = 124
    });
    await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: "X",
          policy_id: "policy-kv03",
          ts: 1_715_000_000_000,
        }),
      },
      buildEnv({ kv }),
    );
    expect(kv.puts[0]?.expirationTtl).toBe(124);
  });

  it("TC-KV-04: 同一リクエスト内では put は高々 1 回", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const kv = createKvStub({ now: () => 1_715_000_000_000 });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: "X",
          policy_id: "policy-kv04",
          ts: 1_715_000_000_000,
        }),
      },
      buildEnv({ kv }),
    );
    expect(kv.puts).toHaveLength(1);
  });

  it("TC-KV-05 / TC-LOG-01: KV get が throw しても fail-open し構造化ログを emit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const kv = createKvStub({
      now: () => 1_715_000_000_000,
      getError: () => new Error("KV get failure"),
    });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    try {
      const res = await app.request(
        "/",
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            name: "X",
            policy_id: "policy-kv05",
            ts: 1_715_000_000_000,
          }),
        },
        buildEnv({ kv }),
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ ok: true, attempts: 1 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const payload = parseStructuredWarn(warnSpy);
      expect(payload).toMatchObject({
        event: "alert_relay_kv_op_failed",
        op: "get",
        errorClass: "Error",
      });
      expect(payload.dedupeKeyHash).toBe(
        await expectedHash("unknown:policy-kv05:28583333"),
      );
      expect(payload.dedupeKeyHash).toMatch(/^[0-9a-f]{12}$/);
      expect(payload.isolateId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(new Date(payload.ts).toISOString()).toBe(payload.ts);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("TC-KV-06: policy_id 欠落時の dedup key は name → alert_type → 'unknown' の順で fallback", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const kv = createKvStub({ now: () => 1_715_000_000_000 });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "fallback-name", ts: 1_715_000_000_000 }),
      },
      buildEnv({ kv }),
    );
    expect(kv.puts[0]?.key).toContain("fallback-name");
  });

  it("TC-KV-07: minuteBucket 境界跨ぎ（59s→60s）で別 key になり再送される", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const kv = createKvStub({ now: () => 1_715_000_000_000 });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    const env = buildEnv({ kv });
    // ts 59_000ms と 60_000ms は minuteBucket が異なる
    await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "X", policy_id: "p", ts: 59_000 }),
      },
      env,
    );
    await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "X", policy_id: "p", ts: 60_000 }),
      },
      env,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("TC-KV-08: deps.dedupeTtlMs を上書きすると expirationTtl に反映される", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const kv = createKvStub({ now: () => 1_715_000_000_000 });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
      dedupeTtlMs: 7_000,
    });
    await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: "X",
          policy_id: "p",
          ts: 1_715_000_000_000,
        }),
      },
      buildEnv({ kv }),
    );
    expect(kv.puts[0]?.expirationTtl).toBe(7);
  });

  it("TC-KV-09 / TC-LOG-02: KV put が throw しても 200 を返し構造化ログを emit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const kv = createKvStub({
      now: () => 1_715_000_000_000,
      putError: () => new Error("KV put failure"),
    });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    try {
      const res = await app.request(
        "/",
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            name: "X",
            policy_id: "policy-kv09",
            ts: 1_715_000_000_000,
          }),
        },
        buildEnv({ kv }),
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({
        ok: true,
        attempts: 1,
        dedupPersisted: false,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const payload = parseStructuredWarn(warnSpy);
      expect(payload).toMatchObject({
        event: "alert_relay_kv_op_failed",
        op: "put",
        errorClass: "Error",
      });
      expect(payload.dedupeKeyHash).toBe(
        await expectedHash("unknown:policy-kv09:28583333"),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("TC-LOG-03: KV 成功 path では console.warn を emit しない", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    try {
      const res = await app.request(
        "/",
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            name: "X",
            policy_id: "policy-log03",
            ts: 1_715_000_000_000,
          }),
        },
        buildEnv(),
      );
      expect(res.status).toBe(200);
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("TC-LOG-04: hash 生成が失敗しても KV put error logging は fail-safe", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const digestSpy = vi
      .spyOn(crypto.subtle, "digest")
      .mockRejectedValueOnce(new Error("digest failure"));
    const kv = createKvStub({
      now: () => 1_715_000_000_000,
      putError: () => new Error("KV put failure"),
    });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    try {
      const res = await app.request(
        "/",
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            name: "X",
            policy_id: "policy-log04",
            ts: 1_715_000_000_000,
          }),
        },
        buildEnv({ kv }),
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({
        ok: true,
        attempts: 1,
        dedupPersisted: false,
      });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(parseStructuredWarn(warnSpy)).toMatchObject({
        event: "alert_relay_kv_op_failed",
        op: "put",
        errorClass: "Error",
        dedupeKeyHash: "hash_error",
      });
    } finally {
      digestSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  it("TC-LOG-05: 同一 isolate 内の複数 emit は同じ isolateId を使う", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const kv = createKvStub({
      now: () => 1_715_000_000_000,
      putError: () => new Error("KV put failure"),
    });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    try {
      for (const policyId of ["policy-log05-a", "policy-log05-b"]) {
        const res = await app.request(
          "/",
          {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({
              name: "X",
              policy_id: policyId,
              ts: 1_715_000_000_000,
            }),
          },
          buildEnv({ kv }),
        );
        expect(res.status).toBe(200);
      }
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(parseStructuredWarnAt(warnSpy, 0).isolateId).toBe(
        parseStructuredWarnAt(warnSpy, 1).isolateId,
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("TC-LOG-06: 同一 dedupe key は決定的に同じ hash を emit する", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const kv = createKvStub({
      now: () => 1_715_000_000_000,
      putError: () => new Error("KV put failure"),
    });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    const request = {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name: "X",
        policy_id: "policy-log06",
        ts: 1_715_000_000_000,
      }),
    };
    try {
      const first = await app.request("/", request, buildEnv({ kv }));
      const second = await app.request("/", request, buildEnv({ kv }));
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(warnSpy).toHaveBeenCalledTimes(2);
      const firstPayload = parseStructuredWarnAt(warnSpy, 0);
      const secondPayload = parseStructuredWarnAt(warnSpy, 1);
      expect(firstPayload.dedupeKeyHash).toBe(secondPayload.dedupeKeyHash);
      expect(firstPayload.dedupeKeyHash).toBe(
        await expectedHash("unknown:policy-log06:28583333"),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("TC-LOG-07: console.warn が throw しても KV put failure response は維持する", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("warn sink failure");
    });
    const kv = createKvStub({
      now: () => 1_715_000_000_000,
      putError: () => new Error("KV put failure"),
    });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    try {
      const res = await app.request(
        "/",
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            name: "X",
            policy_id: "policy-log07",
            ts: 1_715_000_000_000,
          }),
        },
        buildEnv({ kv }),
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({
        ok: true,
        attempts: 1,
        dedupPersisted: false,
      });
      expect(warnSpy).toHaveBeenCalledTimes(2);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("TC-LOG-08: 非 Error throw の errorClass は typeof 値を emit する", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const baseKv = createKvStub({ now: () => 1_715_000_000_000 });
    const kv = {
      ...baseKv,
      kv: {
        ...baseKv.kv,
        put: (async () => {
          throw "kv-string-failure";
        }) as KVNamespace["put"],
      } as KVNamespace,
    } satisfies KvStub;
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => 1_715_000_000_000,
    });
    try {
      const res = await app.request(
        "/",
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            name: "X",
            policy_id: "policy-log08",
            ts: 1_715_000_000_000,
          }),
        },
        buildEnv({ kv }),
      );
      expect(res.status).toBe(200);
      expect(parseStructuredWarn(warnSpy)).toMatchObject({
        event: "alert_relay_kv_op_failed",
        op: "put",
        errorClass: "string",
      });
    } finally {
      warnSpy.mockRestore();
    }
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
