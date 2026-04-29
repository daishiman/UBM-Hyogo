import { describe, expect, it, vi } from "vitest";
import worker from "./index";

type EnvOverrides = {
  HEALTH_DB_TOKEN?: string | undefined;
  DB?: D1Database | undefined;
};

function buildD1(opts: { throwOn?: "prepare" | "first"; result?: unknown } = {}) {
  const hasResult = Object.prototype.hasOwnProperty.call(opts, "result");
  const first = vi.fn(async () => {
    if (opts.throwOn === "first") throw new Error("D1_DOWN");
    return hasResult ? opts.result : { "1": 1 };
  });
  const prepare = vi.fn((_sql: string) => {
    if (opts.throwOn === "prepare") throw new Error("D1_BINDING_MISSING");
    return { first } as unknown as D1PreparedStatement;
  });
  return {
    db: { prepare } as unknown as D1Database,
    spies: { prepare, first },
  };
}

function buildEnv(over: EnvOverrides = {}): Record<string, unknown> {
  return {
    HEALTH_DB_TOKEN: "test-token",
    DB: over.DB ?? buildD1({}).db,
    ENVIRONMENT: "development",
    ...over,
  };
}

async function callHealthDb(env: Record<string, unknown>, headers: Record<string, string> = {}) {
  const req = new Request("https://example.test/health/db", {
    method: "GET",
    headers,
  });
  const ctx = {
    waitUntil: () => undefined,
    passThroughOnException: () => undefined,
  } as unknown as ExecutionContext;
  return worker.fetch(req, env as never, ctx);
}

describe("GET /health/db (UT-06-FU-H)", () => {
  it("T2/T3: 正しい X-Health-Token で SELECT 1 を実行し 200 + 成功 schema を返す", async () => {
    const { db, spies } = buildD1({});
    const env = buildEnv({ DB: db });
    const res = await callHealthDb(env, { "X-Health-Token": "test-token" });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type") ?? "").toContain("application/json");
    const body = await res.json();
    expect(body).toEqual({ ok: true, db: "ok", check: "SELECT 1" });
    expect(spies.prepare).toHaveBeenCalledTimes(1);
    expect(spies.prepare).toHaveBeenCalledWith("SELECT 1");
    expect(spies.first).toHaveBeenCalledTimes(1);
  });

  it("T4: D1 prepare が throw した場合 503 + Retry-After:30 + 失敗 schema を返す", async () => {
    const { db } = buildD1({ throwOn: "prepare" });
    const env = buildEnv({ DB: db });
    const res = await callHealthDb(env, { "X-Health-Token": "test-token" });

    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("30");
    const body = (await res.json()) as { ok: boolean; db: string; error: string };
    expect(body.ok).toBe(false);
    expect(body.db).toBe("error");
    expect(typeof body.error).toBe("string");
    expect(body.error.length).toBeGreaterThan(0);
  });

  it("T4: D1 first が throw した場合も 503 + Retry-After:30 を返す", async () => {
    const { db } = buildD1({ throwOn: "first" });
    const env = buildEnv({ DB: db });
    const res = await callHealthDb(env, { "X-Health-Token": "test-token" });

    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(await res.json()).toEqual({
      ok: false,
      db: "error",
      error: "Error",
    });
  });

  it("T4: SELECT 1 が null を返した場合 503 を返す", async () => {
    const { db } = buildD1({ result: null });
    const env = buildEnv({ DB: db });
    const res = await callHealthDb(env, { "X-Health-Token": "test-token" });

    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(await res.json()).toEqual({
      ok: false,
      db: "error",
      error: "Error",
    });
  });

  it("T5(b): X-Health-Token ヘッダが欠落している場合 401 を返す", async () => {
    const env = buildEnv();
    const res = await callHealthDb(env);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe("unauthorized");
  });

  it("T5(c): X-Health-Token が誤値の場合 401 を返す", async () => {
    const env = buildEnv();
    const res = await callHealthDb(env, { "X-Health-Token": "wrong-token" });
    expect(res.status).toBe(401);
  });

  it("HEALTH_DB_TOKEN 未設定時は fail-closed で 503 を返し DB に触れない", async () => {
    const { db, spies } = buildD1({});
    const env = buildEnv({ DB: db, HEALTH_DB_TOKEN: undefined });
    const res = await callHealthDb(env, { "X-Health-Token": "anything" });
    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(await res.json()).toEqual({
      ok: false,
      db: "error",
      error: "HEALTH_DB_TOKEN unconfigured",
    });
    expect(spies.prepare).not.toHaveBeenCalled();
  });

  it("DB binding 欠落時は 503 + Retry-After:30 + 失敗 schema を返す", async () => {
    const env = buildEnv({ DB: undefined });
    const res = await callHealthDb(env, { "X-Health-Token": "test-token" });

    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("30");
    const body = (await res.json()) as { ok: boolean; db: string; error: string };
    expect(body.ok).toBe(false);
    expect(body.db).toBe("error");
    expect(body.error.length).toBeGreaterThan(0);
  });

  it("token 比較は短い長さ違いでも reject する (タイミング攻撃耐性)", async () => {
    const env = buildEnv();
    const res = await callHealthDb(env, { "X-Health-Token": "x" });
    expect(res.status).toBe(401);
  });

  it("token 比較は長い長さ違いでも reject する (タイミング攻撃耐性)", async () => {
    const env = buildEnv();
    const res = await callHealthDb(env, {
      "X-Health-Token": "test-token-with-extra-suffix",
    });
    expect(res.status).toBe(401);
  });
});
