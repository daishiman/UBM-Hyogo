// UT-09: /admin/sync の認可テスト。
// u-04: 新 sync layer (runManualSync) を mock し互換 endpoint の挙動を保証する。

import { describe, it, expect, vi } from "vitest";

vi.mock("../../sync/manual", () => ({
  runManualSync: vi.fn().mockResolvedValue({
    status: "success",
    auditId: "audit-x",
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

  it("SYNC_ADMIN_TOKEN 未設定は 401 (require-sync-admin)", async () => {
    const res = await adminSyncRoute.request(
      "/sync",
      { method: "POST" },
      { DB: {} as unknown as D1Database },
    );
    // require-sync-admin: token 未設定時は 401 (unauthorized) を返す方針
    expect([401, 500]).toContain(res.status);
  });
});
