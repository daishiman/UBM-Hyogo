// 03b: T-A-* authz / 200 / 409 / 500 を網羅する route テスト。
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../jobs/sync-forms-responses", () => ({
  runResponseSync: vi.fn(),
  previewResponseSync: vi.fn(),
}));

import {
  previewResponseSync,
  runResponseSync,
} from "../../jobs/sync-forms-responses";
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
  beforeEach(() => {
    vi.mocked(runResponseSync).mockReset();
    vi.mocked(previewResponseSync).mockReset();
  });

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

  // issue-1089: dry-run 影響件数プレビュー経路
  const PREVIEW = {
    status: "preview" as const,
    dryRun: true as const,
    responseCount: 7,
    estimatedWrites: 9,
    pagesScanned: 1,
    capped: false,
  };

  it("TC-RT1 dryRun=true は 200 で { ok:true, preview } を返す", async () => {
    vi.mocked(previewResponseSync).mockResolvedValueOnce(PREVIEW);
    const res = await route.request(
      "/sync/responses?dryRun=true",
      { method: "POST", headers: { authorization: "Bearer secret" } },
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; preview: typeof PREVIEW };
    expect(body.ok).toBe(true);
    expect(body.preview).toEqual(PREVIEW);
    // run 経路は呼ばない
    expect(vi.mocked(runResponseSync)).not.toHaveBeenCalled();
  });

  it("TC-RT2 preview 失敗時は 500 { ok:false, error:'preview_failed' }（PII 非露出）", async () => {
    vi.mocked(previewResponseSync).mockRejectedValueOnce(
      new Error("forms-api: 503 leaked@example.com"),
    );
    const res = await route.request(
      "/sync/responses?dryRun=true",
      { method: "POST", headers: { authorization: "Bearer secret" } },
      env,
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe("preview_failed");
    expect(JSON.stringify(body)).not.toContain("@example.com");
  });

  it("TC-RT3 認証は dryRun 前段: Bearer 不一致は 401 で preview に到達しない", async () => {
    const res = await route.request(
      "/sync/responses?dryRun=true",
      { method: "POST", headers: { authorization: "Bearer wrong" } },
      env,
    );
    expect(res.status).toBe(401);
    expect(vi.mocked(previewResponseSync)).not.toHaveBeenCalled();
  });

  it("TC-RT4 dryRun+fullSync 伝播: previewResponseSync が fullSync=true で呼ばれる", async () => {
    vi.mocked(previewResponseSync).mockResolvedValueOnce(PREVIEW);
    await route.request(
      "/sync/responses?dryRun=true&fullSync=true",
      { method: "POST", headers: { authorization: "Bearer secret" } },
      env,
    );
    const lastCall = vi.mocked(previewResponseSync).mock.calls.at(-1);
    expect(lastCall?.[1].fullSync).toBe(true);
  });

  it("TC-RT5 dryRun 未指定は後方互換: run 経路へ入り preview を呼ばない", async () => {
    vi.mocked(runResponseSync).mockResolvedValueOnce({
      status: "succeeded",
      jobId: "j-compat",
      processedCount: 0,
      writeCount: 0,
      cursor: null,
    });
    const res = await route.request(
      "/sync/responses?fullSync=true",
      { method: "POST", headers: { authorization: "Bearer secret" } },
      env,
    );
    expect(res.status).toBe(200);
    expect(vi.mocked(runResponseSync)).toHaveBeenCalled();
    expect(vi.mocked(previewResponseSync)).not.toHaveBeenCalled();
  });
});
