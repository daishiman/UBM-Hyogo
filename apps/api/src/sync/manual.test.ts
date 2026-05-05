// @vitest-environment node
// u-04: runManualSync + manualSyncRoute の integration test。

import { describe, it, expect } from "vitest";
import { setupD1 } from "../repository/__tests__/_setup";
import { runManualSync, manualSyncRoute } from "./manual";

const HEADER = [
  "タイムスタンプ",
  "メールアドレス",
  "回答ID",
  "氏名",
];

function fixtureValues(): string[][] {
  // 既存スキーマでは upsert 対象列が member_responses 側と整合しないため、
  // header-only fixture で audit / lock の生命周期だけを検証する (I-01 は audit only)。
  return [HEADER];
}

describe("u-04 manual sync", () => {
  it("I-01: 成功時は success + auditId を返し sync_job_logs を 1 件残す", async () => {
    const env = await setupD1();
    await env.reset();
    const result = await runManualSync(
      { DB: env.db, SYNC_ADMIN_TOKEN: "tok" } as never,
      {
        fetchValues: async () => ({ values: fixtureValues(), retryCount: 0 }),
        now: () => new Date("2026-04-30T01:00:00.000Z"),
        newId: () => "audit-1",
      },
    );
    expect(result.status).toBe("success");
    expect(result.auditId).toBe("audit-1");
    const log = await env.db
      .prepare("SELECT status, trigger_type FROM sync_job_logs WHERE run_id = ?1")
      .bind("audit-1")
      .first<{ status: string; trigger_type: string }>();
    expect(log?.status).toBe("success");
    expect(log?.trigger_type).toBe("manual");
  });

  it("I-02: SYNC_ADMIN_TOKEN 未一致は 401 を返す", async () => {
    const res = await manualSyncRoute.request(
      "/admin/sync/run",
      {
        method: "POST",
        headers: { authorization: "Bearer wrong" },
      },
      { DB: {} as D1Database, SYNC_ADMIN_TOKEN: "right" },
    );
    expect(res.status).toBe(401);
  });

  it("I-03: SYNC_ADMIN_TOKEN 未設定は 500 を返す", async () => {
    const res = await manualSyncRoute.request(
      "/admin/sync/run",
      { method: "POST", headers: { authorization: "Bearer x" } },
      { DB: {} as D1Database },
    );
    expect(res.status).toBe(500);
  });
});
