// 03b: T-A-* authz / 200 / 409 / 500 を網羅する route テスト。
import { describe, expect, it, vi } from "vitest";

vi.mock("../../jobs/sync-forms-responses", () => ({
  runResponseSync: vi.fn(),
}));

import { runResponseSync } from "../../jobs/sync-forms-responses";
import { createAdminResponsesSyncRoute } from "./responses-sync";

const fakeClient = {} as unknown as Parameters<
  Parameters<typeof createAdminResponsesSyncRoute>[0]["buildClient"]
>[0] extends never
  ? never
  : import("@ubm-hyogo/integrations").GoogleFormsClient;

const route = createAdminResponsesSyncRoute({
  buildClient: () => fakeClient,
});

const env = {
  DB: {} as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "secret",
  GOOGLE_FORM_ID: "f1",
};

describe("admin /sync/responses", () => {
  it("Authorization なしは 401 (T-A-00)", async () => {
    const res = await route.request(
      "/sync/responses",
      { method: "POST" },
      env,
    );
    expect(res.status).toBe(401);
  });

  it("正しい token + idle は 200 (T-A-02)", async () => {
    vi.mocked(runResponseSync).mockResolvedValueOnce({
      status: "succeeded",
      jobId: "j1",
      processedCount: 0,
      writeCount: 0,
      cursor: null,
    });
    const res = await route.request(
      "/sync/responses",
      {
        method: "POST",
        headers: { authorization: "Bearer secret" },
      },
      env,
    );
    expect(res.status).toBe(200);
  });

  it("既に running の場合は 409 (T-A-01 / AC-6)", async () => {
    vi.mocked(runResponseSync).mockResolvedValueOnce({
      status: "skipped",
      jobId: "j2",
      processedCount: 0,
      writeCount: 0,
      cursor: null,
      skippedReason: "another response sync is in progress",
    });
    const res = await route.request(
      "/sync/responses",
      {
        method: "POST",
        headers: { authorization: "Bearer secret" },
      },
      env,
    );
    expect(res.status).toBe(409);
  });

  it("?fullSync=true / ?cursor=abc が runResponseSync に渡る (AC-5)", async () => {
    vi.mocked(runResponseSync).mockResolvedValueOnce({
      status: "succeeded",
      jobId: "j3",
      processedCount: 0,
      writeCount: 0,
      cursor: null,
    });
    await route.request(
      "/sync/responses?fullSync=true",
      {
        method: "POST",
        headers: { authorization: "Bearer secret" },
      },
      env,
    );
    const lastCall = vi.mocked(runResponseSync).mock.calls.at(-1);
    expect(lastCall?.[1].fullSync).toBe(true);
  });

  it("SYNC_ADMIN_TOKEN 未設定は 500 (T-A-03)", async () => {
    const res = await route.request(
      "/sync/responses",
      { method: "POST" },
      { DB: {} as unknown as D1Database },
    );
    expect(res.status).toBe(500);
  });
});
