import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { idempotency } from "../idempotency";

type Row = Record<string, unknown>;

const createDb = (opts: { failSave?: boolean } = {}) => {
  const rows: Row[] = [];
  const db = {
    prepare(sql: string) {
      const params: unknown[] = [];
      return {
        bind(...values: unknown[]) {
          params.push(...values);
          return this;
        },
        async first<T>() {
          if (sql.startsWith("SELECT")) {
            const found = rows.find(
              (row) =>
                row.idempotency_key === params[0] &&
                row.request_method === params[1] &&
                row.request_path === params[2],
            );
            return (found as T) ?? null;
          }
          return null;
        },
        async run() {
          if (sql.startsWith("DELETE FROM idempotency_keys WHERE expires_at")) {
            const now = String(params[0]);
            for (let i = rows.length - 1; i >= 0; i -= 1) {
              if (String(rows[i]?.expires_at) <= now) rows.splice(i, 1);
            }
          } else if (sql.startsWith("DELETE FROM idempotency_keys WHERE id = ? AND")) {
            const idx = rows.findIndex(
              (row) => row.id === params[0] && row.status === "in_flight",
            );
            if (idx >= 0) rows.splice(idx, 1);
          } else if (sql.startsWith("DELETE FROM idempotency_keys WHERE id = ?")) {
            const idx = rows.findIndex((row) => row.id === params[0]);
            if (idx >= 0) rows.splice(idx, 1);
          } else if (sql.startsWith("INSERT INTO idempotency_keys")) {
            if (
              rows.some(
                (row) =>
                  row.idempotency_key === params[1] &&
                  row.request_method === params[2] &&
                  row.request_path === params[3],
              )
            ) {
              throw new Error("UNIQUE constraint failed: idempotency_keys");
            }
            rows.push({
              id: params[0],
              idempotency_key: params[1],
              request_method: params[2],
              request_path: params[3],
              request_fingerprint: params[4],
              status: "in_flight",
              response_status: null,
              response_body: null,
              response_content_type: null,
              created_at: params[5],
              completed_at: null,
              expires_at: params[6],
            });
          } else if (sql.startsWith("UPDATE idempotency_keys")) {
            if (opts.failSave) throw new Error("save failed");
            const row = rows.find((item) => item.id === params[4]);
            if (row) {
              row.status = "completed";
              row.response_status = params[0];
              row.response_body = params[1];
              row.response_content_type = params[2];
              row.completed_at = params[3];
            }
          }
          return { success: true, meta: { changes: 1, last_row_id: 0 } };
        },
        async all<T>() {
          return { results: [] as T[] };
        },
      };
    },
    async exec() {
      return { count: 0, duration: 0 };
    },
  } as unknown as D1Database;
  return { db, rows };
};

const createApp = (db: D1Database) => {
  const app = new Hono<{ Bindings: { DB: D1Database } }>();
  app.use("*", idempotency());
  let calls = 0;
  app.post("/admin/example", async (c) => {
    calls += 1;
    const body = await c.req.json();
    return c.json({ ok: true, calls, body }, 201);
  });
  app.post("/admin/fail", (c) => c.json({ ok: false }, 500));
  return { app, getCalls: () => calls };
};

describe("idempotency middleware", () => {
  it("passes through requests without Idempotency-Key", async () => {
    const { db } = createDb();
    const { app, getCalls } = createApp(db);
    const res = await app.request("/admin/example", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: { "content-type": "application/json" },
    }, { DB: db });
    expect(res.status).toBe(201);
    expect(getCalls()).toBe(1);
  });

  it("replays completed JSON response for identical scope and fingerprint", async () => {
    const { db } = createDb();
    const { app, getCalls } = createApp(db);
    const init = {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: { "content-type": "application/json", "idempotency-key": "same" },
    };
    const first = await app.request("/admin/example", init, { DB: db });
    const second = await app.request("/admin/example", init, { DB: db });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.headers.get("x-idempotency-replayed")).toBe("true");
    expect(await second.json()).toEqual({ ok: true, calls: 1, body: { a: 1 } });
    expect(getCalls()).toBe(1);
  });

  it("returns 409 in_flight when an existing in-flight row matches scope", async () => {
    const { db, rows } = createDb();
    const { app, getCalls } = createApp(db);
    const init = {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: { "content-type": "application/json", "idempotency-key": "inflight" },
    };
    const first = await app.request("/admin/example", init, { DB: db });
    expect(first.status).toBe(201);
    const stored = rows.find((row) => row.idempotency_key === "inflight");
    if (!stored) throw new Error("expected row to be persisted");
    stored.status = "in_flight";
    stored.response_status = null;
    stored.response_body = null;
    stored.response_content_type = null;
    stored.completed_at = null;
    stored.expires_at = "2999-01-01T00:00:00.000Z";
    const callsBeforeRetry = getCalls();
    const second = await app.request("/admin/example", init, { DB: db });
    expect(second.status).toBe(409);
    expect(await second.json()).toEqual({ ok: false, error: "idempotency_in_flight" });
    expect(getCalls()).toBe(callsBeforeRetry);
  });

  it("treats expired completed rows as fresh and re-runs handler", async () => {
    const { db, rows } = createDb();
    const { app, getCalls } = createApp(db);
    rows.push({
      id: "pre-2",
      idempotency_key: "stale",
      request_method: "POST",
      request_path: "/admin/example",
      request_fingerprint: "old",
      status: "completed",
      response_status: 201,
      response_body: '{"old":true}',
      response_content_type: "application/json",
      created_at: "2000-01-01T00:00:00.000Z",
      completed_at: "2000-01-01T00:00:01.000Z",
      expires_at: "2000-01-02T00:00:00.000Z",
    });
    const res = await app.request(
      "/admin/example",
      {
        method: "POST",
        body: JSON.stringify({ a: 9 }),
        headers: { "content-type": "application/json", "idempotency-key": "stale" },
      },
      { DB: db },
    );
    expect(res.status).toBe(201);
    expect(res.headers.get("x-idempotency-replayed")).toBeNull();
    expect(getCalls()).toBe(1);
  });

  it("skips persisting oversized response bodies and re-runs on retry", async () => {
    const { db, rows } = createDb();
    const app = new Hono<{ Bindings: { DB: D1Database } }>();
    app.use("*", idempotency());
    let calls = 0;
    const big = "x".repeat(64 * 1024 + 1);
    app.post("/admin/big", (c) => {
      calls += 1;
      return c.json({ ok: true, big }, 200);
    });
    const init = {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: { "content-type": "application/json", "idempotency-key": "huge" },
    };
    const first = await app.request("/admin/big", init, { DB: db });
    expect(first.status).toBe(200);
    expect(rows.some((row) => row.idempotency_key === "huge")).toBe(false);
    const second = await app.request("/admin/big", init, { DB: db });
    expect(second.status).toBe(200);
    expect(calls).toBe(2);
  });

  it("does not turn a successful handler response into 500 when result persistence fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db, rows } = createDb({ failSave: true });
    const { app } = createApp(db);
    try {
      const res = await app.request("/admin/example", {
        method: "POST",
        body: JSON.stringify({ a: 1 }),
        headers: { "content-type": "application/json", "idempotency-key": "save-fail" },
      }, { DB: db });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ ok: true, calls: 1, body: { a: 1 } });
      expect(rows.some((row) => row.idempotency_key === "save-fail")).toBe(false);
      expect(errorSpy).toHaveBeenCalledOnce();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("rejects reused key with different body and does not persist 5xx", async () => {
    const { db, rows } = createDb();
    const { app } = createApp(db);
    await app.request("/admin/example", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: { "content-type": "application/json", "idempotency-key": "mismatch" },
    }, { DB: db });
    const mismatch = await app.request("/admin/example", {
      method: "POST",
      body: JSON.stringify({ a: 2 }),
      headers: { "content-type": "application/json", "idempotency-key": "mismatch" },
    }, { DB: db });
    expect(mismatch.status).toBe(422);

    const failed = await app.request("/admin/fail", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: { "content-type": "application/json", "idempotency-key": "fail" },
    }, { DB: db });
    expect(failed.status).toBe(500);
    expect(rows.some((row) => row.idempotency_key === "fail")).toBe(false);
  });
});
