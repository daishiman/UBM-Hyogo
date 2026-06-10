// 06c: lib/admin/api.ts の不変条件アサーション + call() 振る舞い契約
// 不変条件 #11: profile 本文編集 mutation を export しない
// 不変条件 #13: tag 直接更新 mutation を export しない
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as adminApi from "../api";

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const plainResponse = (status: number, body: string): Response =>
  new Response(body, { status, headers: { "content-type": "text/plain" } });

describe("lib/admin/api.ts (不変条件)", () => {
  it("profile 本文編集の mutation export を持たない (#11)", () => {
    const keys = Object.keys(adminApi);
    expect(keys.some((k) => /profile|businessOverview|selfIntroduction/i.test(k))).toBe(false);
  });

  it("tag 直接更新 mutation を持たず resolveTagQueue のみ (#13)", () => {
    const keys = Object.keys(adminApi);
    const tagKeys = keys.filter((k) => /tag/i.test(k));
    expect(tagKeys).toEqual(["resolveTagQueue"]);
  });

  it("attendance / status / notes / schema-alias / meeting の mutation を export する", () => {
    expect(typeof adminApi.patchMemberStatus).toBe("function");
    expect(typeof adminApi.postMemberNote).toBe("function");
    expect(typeof adminApi.patchMemberNote).toBe("function");
    expect(typeof adminApi.deleteMember).toBe("function");
    expect(typeof adminApi.resolveTagQueue).toBe("function");
    expect(typeof adminApi.postSchemaAlias).toBe("function");
    expect(typeof adminApi.rollbackSchemaAlias).toBe("function");
    expect(typeof adminApi.rollbackSchemaAliasBulk).toBe("function");
    expect(typeof adminApi.createMeeting).toBe("function");
    expect(typeof adminApi.addAttendance).toBe("function");
    expect(typeof adminApi.removeAttendance).toBe("function");
  });

  it("attendance mutation は 06c-E の { attended } alias endpoint を使う", async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(init === undefined ? { input } : { input, init });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    try {
      await adminApi.addAttendance("s/1", "m1");
      await adminApi.removeAttendance("s/1", "m1");
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({
      input: "/api/admin/meetings/s%2F1/attendances",
      init: {
        method: "POST",
        body: JSON.stringify({ memberId: "m1", attended: true }),
      },
    });
    expect(calls[1]).toMatchObject({
      input: "/api/admin/meetings/s%2F1/attendances",
      init: {
        method: "POST",
        body: JSON.stringify({ memberId: "m1", attended: false }),
      },
    });
  });
});

describe("lib/admin/api.ts call() の振る舞い", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("PATCH /api/admin/members/:id/status: encodeURIComponent と JSON body を送る", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, { id: "abc def" }));
    const res = await adminApi.patchMemberStatus("abc def", { publishState: "public" });
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/members/abc%20def/status");
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ publishState: "public" }));
    expect((init.headers as Record<string, string>)["content-type"]).toBe(
      "application/json",
    );
  });

  it("POST notes: ノート作成 path と body 形を確認", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(201, { id: "n1" }));
    const res = await adminApi.postMemberNote("m1", "本文");
    expect(res.ok).toBe(true);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/members/m1/notes");
    expect(init.body).toBe(JSON.stringify({ body: "本文" }));
  });

  it("PATCH note: noteId も encode し path を組み立てる", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, {}));
    await adminApi.patchMemberNote("m1", "n#1", "x");
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toBe("/api/admin/members/m1/notes/n%231");
  });

  it("ネットワークエラーで status=0 / error を返す", async () => {
    fetchSpy.mockRejectedValue(new Error("boom"));
    const res = await adminApi.patchMemberStatus("m1", {});
    expect(res).toEqual({ ok: false, status: 0, error: "boom" });
  });

  it("非 Error の reject も network error にマップする", async () => {
    fetchSpy.mockRejectedValue("string-fail");
    const res = await adminApi.deleteMember("m1", "r");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(0);
      expect(res.error).toBe("network error");
    }
  });

  it("res.ok=false かつ JSON {error}: error string をそのまま伝搬する", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(400, { error: "bad input" }));
    const res = await adminApi.createMeeting({ title: "t", heldOn: "2026-01-01" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(400);
      expect(res.error).toBe("bad input");
    }
  });

  it("res.ok=false かつ非 JSON: HTTP <status> を error にする", async () => {
    fetchSpy.mockResolvedValue(plainResponse(500, "Internal Server Error"));
    const res = await adminApi.restoreMember("m1");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(500);
      expect(res.error).toBe("HTTP 500");
    }
  });

  it("JSON parse 失敗時も throw せず status だけ返す", async () => {
    const res = new Response("not json", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    fetchSpy.mockResolvedValue(res);
    const out = await adminApi.addAttendance("s1", "m1");
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.status).toBe(200);
      expect(out.data).toBeNull();
    }
  });

  it("API-01 postSchemaAlias 200 success: confirmed=true, backfill.status=completed, predicate=false", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(200, {
        ok: true,
        mode: "apply",
        confirmed: true,
        backfill: { status: "completed" },
      }),
    );
    const r = await adminApi.postSchemaAlias({
      questionId: "q1",
      stableKey: "k1",
      diffId: "d1",
    });
    expect(r.ok).toBe(true);
    expect(r.status).toBe(200);
    expect(adminApi.isSchemaAliasRetryableContinuation(r)).toBe(false);
  });

  it("API-02 postSchemaAlias 202 retryable continuation: predicate=true", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(202, {
        ok: true,
        mode: "apply",
        confirmed: true,
        backfill: {
          status: "exhausted",
          retryable: true,
          code: "backfill_cpu_budget_exhausted",
        },
      }),
    );
    const r = await adminApi.postSchemaAlias({
      questionId: "q1",
      stableKey: "k1",
      diffId: "d1",
    });
    expect(r.ok).toBe(true);
    expect(r.status).toBe(202);
    expect(adminApi.isSchemaAliasRetryableContinuation(r)).toBe(true);
  });

  it("API-03 postSchemaAlias 202 status=pending: predicate=false（exhausted 合致を要求）", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(202, {
        ok: true,
        mode: "apply",
        confirmed: true,
        backfill: { status: "pending", retryable: true },
      }),
    );
    const r = await adminApi.postSchemaAlias({
      questionId: "q1",
      stableKey: "k1",
    });
    expect(adminApi.isSchemaAliasRetryableContinuation(r)).toBe(false);
  });

  it("API-03b postSchemaAlias 202 exhausted without code: predicate=false（code 合致を要求）", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(202, {
        ok: true,
        mode: "apply",
        confirmed: true,
        backfill: { status: "exhausted", retryable: true },
      }),
    );
    const r = await adminApi.postSchemaAlias({
      questionId: "q1",
      stableKey: "k1",
    });
    expect(adminApi.isSchemaAliasRetryableContinuation(r)).toBe(false);
  });

  it("API-04 postSchemaAlias 422 validation error: ok=false / predicate=false", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(422, {
        ok: false,
        code: "stable_key_collision",
        error: "invalid",
        existingQuestionIds: ["q2"],
      }),
    );
    const r = await adminApi.postSchemaAlias({ questionId: "q1", stableKey: "k1" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(422);
      expect(r.error).toBe("invalid");
      expect(r.data).toEqual({
        ok: false,
        code: "stable_key_collision",
        error: "invalid",
        existingQuestionIds: ["q2"],
      });
    }
    expect(adminApi.isSchemaAliasRetryableContinuation(r)).toBe(false);
  });

  it("API-05 postSchemaAlias 409 conflict: ok=false / predicate=false", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(409, {
        ok: false,
        error: "conflict",
        existingStableKey: "full_name",
      }),
    );
    const r = await adminApi.postSchemaAlias({ questionId: "q1", stableKey: "k1" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(409);
      expect(r.error).toBe("conflict");
      expect(r.data).toEqual({
        ok: false,
        error: "conflict",
        existingStableKey: "full_name",
      });
    }
    expect(adminApi.isSchemaAliasRetryableContinuation(r)).toBe(false);
  });

  it("BULK-01 postSchemaAliasBulk([]) → 即座に results=[] を返し fetch しない", async () => {
    const out = await adminApi.postSchemaAliasBulk([]);
    expect(out).toEqual({ results: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("BULK-02 3 件全件成功 → results[].status === success", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(200, {
        ok: true,
        mode: "apply",
        confirmed: true,
        backfill: { status: "completed" },
      }),
    );
    const out = await adminApi.postSchemaAliasBulk([
      { diffId: "d1", questionId: "q1", stableKey: "k1" },
      { diffId: "d2", questionId: "q2", stableKey: "k2" },
      { diffId: "d3", questionId: "q3", stableKey: "k3" },
    ]);
    expect(out.results.map((r) => r.status)).toEqual([
      "success",
      "success",
      "success",
    ]);
    expect(out.results.map((r) => r.diffId)).toEqual(["d1", "d2", "d3"]);
  });

  it("BULK-03 1 件 409 → 2 success + 1 error(conflict)、入力順を維持", async () => {
    fetchSpy.mockImplementation((_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      if (body.diffId === "d2") {
        return Promise.resolve(
          jsonResponse(409, { ok: false, error: "conflict" }),
        );
      }
      return Promise.resolve(
        jsonResponse(200, {
          ok: true,
          mode: "apply",
          confirmed: true,
          backfill: { status: "completed" },
        }),
      );
    });
    const out = await adminApi.postSchemaAliasBulk([
      { diffId: "d1", questionId: "q1", stableKey: "k1" },
      { diffId: "d2", questionId: "q2", stableKey: "k2" },
      { diffId: "d3", questionId: "q3", stableKey: "k3" },
    ]);
    expect(out.results.map((r) => r.status)).toEqual([
      "success",
      "error",
      "success",
    ]);
    expect(out.results[1].error?.kind).toBe("conflict");
    expect(out.results[1].error?.httpStatus).toBe(409);
  });

  it("BULK-04 1 件 422 → error(invalid)", async () => {
    fetchSpy.mockImplementation((_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      if (body.diffId === "d1") {
        return Promise.resolve(
          jsonResponse(422, { ok: false, error: "invalid" }),
        );
      }
      return Promise.resolve(
        jsonResponse(200, {
          ok: true,
          mode: "apply",
          confirmed: true,
          backfill: { status: "completed" },
        }),
      );
    });
    const out = await adminApi.postSchemaAliasBulk([
      { diffId: "d1", questionId: "q1", stableKey: "k1" },
      { diffId: "d2", questionId: "q2", stableKey: "k2" },
    ]);
    expect(out.results[0].status).toBe("error");
    expect(out.results[0].error?.kind).toBe("invalid");
    expect(out.results[0].error?.httpStatus).toBe(422);
    expect(out.results[1].status).toBe("success");
  });

  it("BULK-05 network 失敗 → error.kind = network", async () => {
    fetchSpy.mockRejectedValue(new Error("boom"));
    const out = await adminApi.postSchemaAliasBulk([
      { diffId: "d1", questionId: "q1", stableKey: "k1" },
    ]);
    expect(out.results[0].status).toBe("error");
    expect(out.results[0].error?.kind).toBe("network");
    expect(out.results[0].error?.httpStatus).toBe(0);
    expect(out.results[0].error?.message).toBe("boom");
  });

  it("BULK-05b row 完了ごとに onRowResult を呼び、stableKey を trim して送る", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(200, {
        ok: true,
        mode: "apply",
        confirmed: true,
        backfill: { status: "completed" },
      }),
    );
    const onRowResult = vi.fn();
    const out = await adminApi.postSchemaAliasBulk(
      [{ diffId: "d1", questionId: "q1", stableKey: " key_one " }],
      { onRowResult },
    );
    expect(out.results[0].status).toBe("success");
    expect(onRowResult).toHaveBeenCalledWith(out.results[0], 0);
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toMatchObject({
      stableKey: "key_one",
    });
  });

  it("BULK-06 8 件 を最大 concurrency 8 で実行し、結果は入力順", async () => {
    let inflight = 0;
    let maxInflight = 0;
    fetchSpy.mockImplementation(async (_u: unknown, init?: RequestInit) => {
      inflight++;
      maxInflight = Math.max(maxInflight, inflight);
      await new Promise((r) => setTimeout(r, 1));
      inflight--;
      const body = JSON.parse(String(init?.body ?? "{}"));
      return jsonResponse(200, {
        ok: true,
        mode: "apply",
        confirmed: true,
        backfill: { status: "completed" },
        diffId: body.diffId,
      });
    });
    const inputs = Array.from({ length: 8 }, (_, i) => ({
      diffId: `d${i}`,
      questionId: `q${i}`,
      stableKey: `k${i}`,
    }));
    const out = await adminApi.postSchemaAliasBulk(inputs);
    expect(out.results.map((r) => r.diffId)).toEqual(
      inputs.map((i) => i.diffId),
    );
    expect(maxInflight).toBeLessThanOrEqual(8);
  });

  it("BULK-07 202 retryable continuation → status=retryable / error.kind=retryable", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(202, {
        ok: true,
        mode: "apply",
        confirmed: true,
        backfill: {
          status: "exhausted",
          retryable: true,
          code: "backfill_cpu_budget_exhausted",
        },
      }),
    );
    const out = await adminApi.postSchemaAliasBulk([
      { diffId: "d1", questionId: "q1", stableKey: "k1" },
    ]);
    expect(out.results[0].status).toBe("retryable");
    expect(out.results[0].error?.kind).toBe("retryable");
    expect(out.results[0].error?.httpStatus).toBe(202);
  });

  it("postSchemaAlias / resolveAdminRequest / resolveTagQueue も path/body 整合", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, {}));
    await adminApi.postSchemaAlias({ questionId: "q1", stableKey: "k1" });
    expect((fetchSpy.mock.calls[0] as [string])[0]).toBe(
      "/api/admin/schema/aliases",
    );

    fetchSpy.mockResolvedValue(jsonResponse(200, {}));
    await adminApi.resolveTagQueue("queue 1", { decision: "approve" } as never);
    expect((fetchSpy.mock.calls[1] as [string])[0]).toBe(
      "/api/admin/tags/queue/queue%201/resolve",
    );

    fetchSpy.mockResolvedValue(jsonResponse(200, {}));
    await adminApi.resolveAdminRequest("note 1", { decision: "approve" } as never);
    expect((fetchSpy.mock.calls[2] as [string])[0]).toBe(
      "/api/admin/requests/note%201/resolve",
    );
  });

  it("rollbackSchemaAlias: If-Match と reason body を送る", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(200, {
        aliasId: "a 1",
        rolledBackAt: "2026-05-19T00:00:00.000Z",
        relatedAuditId: "aud-1",
        newVersion: 3,
        impact: { affectedResponseCount: 2, recomputeRequired: true },
      }),
    );
    const res = await adminApi.rollbackSchemaAlias({
      aliasId: "a 1",
      version: 2,
      reason: "typo",
    });
    expect(res.newVersion).toBe(3);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/schema/aliases/a%201/rollback");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ reason: "typo" }));
    expect((init.headers as Record<string, string>)["If-Match"]).toBe("version=2");
  });

  it("rollbackSchemaAlias: 409 JSON error を RollbackApiError に変換する", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(409, { error: "version_mismatch", message: "race detected" }),
    );
    await expect(
      adminApi.rollbackSchemaAlias({ aliasId: "a1", version: 1 }),
    ).rejects.toMatchObject({
      name: "RollbackApiError",
      status: 409,
      code: "version_mismatch",
      message: "race detected",
    });
  });

  it("rollbackSchemaAlias: network error を status=0 に変換する", async () => {
    fetchSpy.mockRejectedValue(new Error("offline"));
    await expect(
      adminApi.rollbackSchemaAlias({ aliasId: "a1", version: 1 }),
    ).rejects.toMatchObject({
      name: "RollbackApiError",
      status: 0,
      code: "network_error",
      message: "offline",
    });
  });

  it("BULK-ROLLBACK-01 rollbackSchemaAliasBulk は single rollback endpoint を行ごとに呼ぶ", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(200, {
        aliasId: "alias-1",
        rolledBackAt: "2026-05-19T00:00:00.000Z",
        relatedAuditId: "aud-1",
        newVersion: 3,
        impact: { affectedResponseCount: 2, recomputeRequired: false },
      }),
    );
    const onRowResult = vi.fn();
    const out = await adminApi.rollbackSchemaAliasBulk(
      [
        { aliasId: "alias-1", version: 1 },
        { aliasId: "alias 2", version: 2 },
      ],
      { onRowResult },
    );
    expect(out.results.map((r) => r.status)).toEqual(["success", "success"]);
    expect((fetchSpy.mock.calls[0] as [string])[0]).toBe(
      "/api/admin/schema/aliases/alias-1/rollback",
    );
    expect((fetchSpy.mock.calls[1] as [string])[0]).toBe(
      "/api/admin/schema/aliases/alias%202/rollback",
    );
    expect(onRowResult).toHaveBeenCalledWith(out.results[0], 0);
  });

  it("BULK-ROLLBACK-02 rollbackSchemaAliasBulk は 409 を row-level version_mismatch にする", async () => {
    fetchSpy.mockImplementation((url: unknown) => {
      if (String(url).includes("alias-2")) {
        return Promise.resolve(
          jsonResponse(409, { error: "version_mismatch", message: "race detected" }),
        );
      }
      return Promise.resolve(
        jsonResponse(200, {
          aliasId: "alias-1",
          rolledBackAt: "2026-05-19T00:00:00.000Z",
          relatedAuditId: null,
          newVersion: 2,
          impact: { affectedResponseCount: 0, recomputeRequired: false },
        }),
      );
    });
    const out = await adminApi.rollbackSchemaAliasBulk([
      { aliasId: "alias-1", version: 1 },
      { aliasId: "alias-2", version: 1 },
    ]);
    expect(out.results.map((r) => r.status)).toEqual(["success", "error"]);
    expect(out.results[1].error).toMatchObject({
      kind: "version_mismatch",
      httpStatus: 409,
      message: "race detected",
    });
  });
});

// Issue #836 (T-12): recompute helper の path / body / error 変換
describe("recomputeSchemaAlias() / getSchemaAliasRecomputeStatus()", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("recomputeSchemaAlias: encode 済み path に POST し reason body を送る（triggerKey は送らない）", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(200, {
        jobId: "job-1",
        aliasId: "a 1",
        status: "completed",
        affectedCount: 3,
        processedCount: 3,
        updatedCount: 3,
        deletedCollisionCount: 0,
        recomputeAuditId: "aud-1",
        relatedRollbackAuditId: "rb-1",
      }),
    );
    const res = await adminApi.recomputeSchemaAlias({
      aliasId: "a 1",
      reason: "operator typo",
    });
    expect(res.status).toBe("completed");
    expect(res.processedCount).toBe(3);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/schema/aliases/a%201/recompute");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).toEqual({ reason: "operator typo" });
    expect(body).not.toHaveProperty("triggerKey");
  });

  it("recomputeSchemaAlias: 409 JSON error を RecomputeApiError に変換する", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(409, { error: "not_rolled_back", message: "not rolled back" }),
    );
    await expect(
      adminApi.recomputeSchemaAlias({ aliasId: "a1" }),
    ).rejects.toMatchObject({
      name: "RecomputeApiError",
      status: 409,
      code: "not_rolled_back",
      message: "not rolled back",
    });
  });

  it("recomputeSchemaAlias: network error を status=0 に変換する", async () => {
    fetchSpy.mockRejectedValue(new Error("offline"));
    await expect(
      adminApi.recomputeSchemaAlias({ aliasId: "a1" }),
    ).rejects.toMatchObject({
      name: "RecomputeApiError",
      status: 0,
      code: "network_error",
      message: "offline",
    });
  });

  it("getSchemaAliasRecomputeStatus: body null のとき null を返す", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, null));
    const res = await adminApi.getSchemaAliasRecomputeStatus("a1");
    expect(res).toBeNull();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/schema/aliases/a1/recompute");
    expect(init.method).toBe("GET");
  });

  it("getSchemaAliasRecomputeStatus: job 行が存在するとき status を返す", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(200, {
        jobId: "job-1",
        aliasId: "a1",
        status: "running",
        affectedCount: 5,
        processedCount: 2,
        updatedCount: 2,
        deletedCollisionCount: 0,
        lastError: null,
        updatedAt: "2026-05-19T00:00:00.000Z",
      }),
    );
    const res = await adminApi.getSchemaAliasRecomputeStatus("a1");
    expect(res?.status).toBe("running");
    expect(res?.processedCount).toBe(2);
  });
});

// issue-777: fetchSchemaAliasHistory helper unit spec
describe("fetchSchemaAliasHistory()", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const okPayload = (over: Partial<Record<string, unknown>> = {}) => ({
    ok: true,
    items: [
      {
        auditId: "a1",
        actorId: "admin1",
        actorEmail: "admin@example.com",
        action: "schema_diff.alias_assigned",
        targetType: "schema_diff",
        targetId: "q1",
        maskedBefore: { stableKey: "unknown" },
        maskedAfter: { stableKey: "full_name", questionText: "氏名" },
        parseError: false,
        createdAt: "2026-05-19T10:00:00Z",
      },
    ],
    nextCursor: null,
    appliedFilters: {
      action: "schema_diff.alias_assigned",
      actorEmail: null,
      targetType: null,
      targetId: null,
      from: null,
      to: null,
      batchId: null,
      limit: 50,
    },
    ...over,
  });

  it("TC-H-01: export 存在", () => {
    expect(typeof adminApi.fetchSchemaAliasHistory).toBe("function");
  });

  it("TC-H-02: 既定 query は action / limit", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, okPayload({ items: [] })));
    await adminApi.fetchSchemaAliasHistory();
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit?];
    expect(url).toContain("/api/admin/audit?");
    expect(url).toContain("action=schema_diff.alias_assigned");
    expect(url).toContain("limit=50");
  });

  it("TC-H-03: cursor を URL query に乗せる", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, okPayload({ items: [] })));
    await adminApi.fetchSchemaAliasHistory({ cursor: "abc" });
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("cursor=abc");
  });

  it("TC-H-04: filter を URL query に乗せ、questionTextLike は含めない", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, okPayload({ items: [] })));
    await adminApi.fetchSchemaAliasHistory({
      actorEmail: "foo@example.com",
      from: "2026-05-01",
      to: "2026-05-19",
      questionTextLike: "a&b",
    });
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("actorEmail=foo%40example.com");
    expect(url).toContain("from=2026-05-01");
    expect(url).toContain("to=2026-05-19");
    expect(url).not.toContain("questionTextLike");
    expect(url).not.toContain("a%26b");
  });

  it("TC-H-04b: actorEmail を小文字化", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, okPayload({ items: [] })));
    await adminApi.fetchSchemaAliasHistory({ actorEmail: "Foo@Example.COM" });
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("actorEmail=foo%40example.com");
  });

  it("TC-H-05: 200 OK で SchemaAliasHistoryItem 配列を返す", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, okPayload()));
    const r = await adminApi.fetchSchemaAliasHistory();
    expect(r.items.length).toBe(1);
    expect(r.items[0]).toEqual({
      auditId: "a1",
      actorEmail: "admin@example.com",
      createdAt: "2026-05-19T10:00:00Z",
      beforeStableKey: "unknown",
      afterStableKey: "full_name",
      questionText: "氏名",
    });
    expect(r.nextCursor).toBeNull();
  });

  it("TC-H-05b: appliedFilters.batchId を受理する", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(
        200,
        okPayload({
          appliedFilters: {
            action: "schema_diff.alias_assigned",
            actorEmail: null,
            targetType: null,
            targetId: null,
            from: null,
            to: null,
            batchId: "batch-1",
            limit: 50,
          },
        }),
      ),
    );
    const r = await adminApi.fetchSchemaAliasHistory();
    expect(r.appliedFilters.batchId).toBe("batch-1");
  });

  it("TC-H-05c: appliedFilters.batchId null を受理する", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(
        200,
        okPayload({
          appliedFilters: {
            action: "schema_diff.alias_assigned",
            actorEmail: null,
            targetType: null,
            targetId: null,
            from: null,
            to: null,
            batchId: null,
            limit: 50,
          },
        }),
      ),
    );
    const r = await adminApi.fetchSchemaAliasHistory();
    expect(r.appliedFilters.batchId).toBeNull();
  });

  it("TC-H-07: HTTP 500 で throw", async () => {
    fetchSpy.mockResolvedValue(plainResponse(500, "boom"));
    await expect(adminApi.fetchSchemaAliasHistory()).rejects.toThrow(/HTTP 500/);
  });
});
