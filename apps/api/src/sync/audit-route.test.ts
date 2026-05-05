// @vitest-environment node
// u-04: GET /admin/sync/audit のクエリ検証 + 認証テスト。

import { describe, it, expect } from "vitest";
import { setupD1 } from "../repository/__tests__/_setup";
import { auditQueryRoute } from "./audit-route";

describe("u-04 audit-route", () => {
  it("I-08: limit 既定で 200 + items 配列を返す", async () => {
    const env = await setupD1();
    await env.reset();
    await env.db
      .prepare(
        `INSERT INTO sync_job_logs (run_id, trigger_type, status, started_at)
         VALUES ('a-1', 'manual', 'success', '2026-04-30T00:00:00.000Z')`,
      )
      .run();
    const res = await auditQueryRoute.request(
      "/admin/sync/audit",
      { headers: { authorization: "Bearer tok" } },
      { DB: env.db, SYNC_ADMIN_TOKEN: "tok" },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; items: unknown[] };
    expect(body.ok).toBe(true);
    expect(body.items).toHaveLength(1);
  });

  it("I-09: limit=0 や limit=200 のような不正値は 400", async () => {
    const env = await setupD1();
    const res = await auditQueryRoute.request(
      "/admin/sync/audit?limit=200",
      { headers: { authorization: "Bearer tok" } },
      { DB: env.db, SYNC_ADMIN_TOKEN: "tok" },
    );
    expect(res.status).toBe(400);
  });

  it("無認証は 401 を返す", async () => {
    const env = await setupD1();
    const res = await auditQueryRoute.request(
      "/admin/sync/audit",
      {},
      { DB: env.db, SYNC_ADMIN_TOKEN: "tok" },
    );
    expect(res.status).toBe(401);
  });
});
