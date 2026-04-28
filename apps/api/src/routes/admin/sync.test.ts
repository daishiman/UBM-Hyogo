// UT-09: /admin/sync の認可テスト。

import { describe, it, expect, vi } from "vitest";

vi.mock("../../jobs/sync-sheets-to-d1", () => ({
  runSync: vi.fn().mockResolvedValue({
    status: "success",
    runId: "run-x",
    fetched: 0,
    upserted: 0,
    failed: 0,
    retryCount: 0,
    durationMs: 0,
  }),
}));

import { adminSyncRoute } from "./sync";

const env = {
  DB: {} as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "secret-token",
};

describe("adminSyncRoute", () => {
  it("Authorization ヘッダなしは 401", async () => {
    const res = await adminSyncRoute.request(
      "/sync",
      { method: "POST" },
      env,
    );
    expect(res.status).toBe(401);
  });

  it("不正なトークンは 401", async () => {
    const res = await adminSyncRoute.request(
      "/sync",
      {
        method: "POST",
        headers: { authorization: "Bearer wrong" },
      },
      env,
    );
    expect(res.status).toBe(401);
  });

  it("正しいトークンは 200 で成功 result を返す", async () => {
    const res = await adminSyncRoute.request(
      "/sync",
      {
        method: "POST",
        headers: { authorization: "Bearer secret-token" },
      },
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; result: { status: string } };
    expect(body.ok).toBe(true);
    expect(body.result.status).toBe("success");
  });

  it("SYNC_ADMIN_TOKEN 未設定は 500", async () => {
    const res = await adminSyncRoute.request(
      "/sync",
      { method: "POST" },
      { DB: {} as unknown as D1Database },
    );
    expect(res.status).toBe(500);
  });
});
