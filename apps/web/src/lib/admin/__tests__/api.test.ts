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
    expect(typeof adminApi.createMeeting).toBe("function");
    expect(typeof adminApi.addAttendance).toBe("function");
    expect(typeof adminApi.removeAttendance).toBe("function");
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

  it("DELETE attendance: method=DELETE で body を送らない", async () => {
    fetchSpy.mockResolvedValue(jsonResponse(200, null));
    await adminApi.removeAttendance("s1", "m1");
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/meetings/s1/attendance/m1");
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
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
});
