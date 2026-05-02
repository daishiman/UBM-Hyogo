// 06b-B: client helper の unit test。
// 紐付き TC: TC-U-13..20, TC-I-03..05。
// 注: TC-I-01/02 (shared zod 型 contract) は packages/shared 化が必要なため Phase 12 follow-up に積む。
import { afterEach, describe, expect, it, vi, expectTypeOf } from "vitest";
import {
  AuthRequiredError,
  requestDelete,
  requestVisibilityChange,
} from "./me-requests";
import type {
  DeleteRequestInput,
  QueueAccepted,
  VisibilityRequestInput,
} from "./me-requests.types";

const acceptedFixture: QueueAccepted = {
  queueId: "q1",
  type: "visibility_request",
  status: "pending",
  createdAt: "2026-05-02T00:00:00.000Z",
};

const mockFetch = (status: number, body: object | string) => {
  const init: ResponseInit = {
    status,
    headers: { "content-type": "application/json" },
  };
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(payload, init),
  );
  return spy;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("requestVisibilityChange", () => {
  it("TC-U-13: 202 → ok=true", async () => {
    mockFetch(202, acceptedFixture);
    const res = await requestVisibilityChange({ desiredState: "hidden" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.accepted).toEqual(acceptedFixture);
  });

  it("TC-U-14: 409 → DUPLICATE_PENDING_REQUEST", async () => {
    mockFetch(409, { error: "DUPLICATE_PENDING_REQUEST" });
    const res = await requestVisibilityChange({ desiredState: "hidden" });
    expect(res).toEqual({ ok: false, code: "DUPLICATE_PENDING_REQUEST", status: 409 });
  });

  it("TC-U-15: 422 → INVALID_REQUEST", async () => {
    mockFetch(422, { error: "INVALID_REQUEST" });
    const res = await requestVisibilityChange({ desiredState: "hidden" });
    expect(res).toEqual({ ok: false, code: "INVALID_REQUEST", status: 422 });
  });

  it("TC-U-16: 401 → throw AuthRequiredError", async () => {
    mockFetch(401, { error: "UNAUTHORIZED" });
    await expect(
      requestVisibilityChange({ desiredState: "hidden" }),
    ).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it("TC-U-17: 429 → RATE_LIMITED", async () => {
    mockFetch(429, { error: "RATE_LIMITED" });
    const res = await requestVisibilityChange({ desiredState: "hidden" });
    expect(res).toEqual({ ok: false, code: "RATE_LIMITED", status: 429 });
  });

  it("TC-U-18: 500 → SERVER", async () => {
    mockFetch(503, { error: "SERVER" });
    const res = await requestVisibilityChange({ desiredState: "hidden" });
    expect(res).toEqual({ ok: false, code: "SERVER", status: 503 });
  });

  it("TC-U-19: network failure → NETWORK", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    const res = await requestVisibilityChange({ desiredState: "hidden" });
    expect(res).toEqual({ ok: false, code: "NETWORK" });
  });

  it("TC-U-20 / TC-I-04: URL は /api/me/visibility-request 固定 + POST + JSON", async () => {
    const spy = mockFetch(202, acceptedFixture);
    await requestVisibilityChange({ desiredState: "hidden", reason: "x" });
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0]!;
    expect(url).toBe("/api/me/visibility-request");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["content-type"]).toBe(
      "application/json",
    );
    expect(init?.credentials).toBe("same-origin");
    expect(JSON.parse(init?.body as string)).toEqual({
      desiredState: "hidden",
      reason: "x",
    });
  });

  it("client zod: reason > 500 で 早期 INVALID_REQUEST（fetch 呼ばない）", async () => {
    const spy = mockFetch(202, acceptedFixture);
    const res = await requestVisibilityChange({
      desiredState: "hidden",
      reason: "a".repeat(501),
    });
    expect(res).toEqual({ ok: false, code: "INVALID_REQUEST", status: 422 });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("requestDelete", () => {
  it("TC-I-05: 空 body 許容 → 202", async () => {
    const spy = mockFetch(202, { ...acceptedFixture, type: "delete_request" });
    const res = await requestDelete();
    expect(res.ok).toBe(true);
    expect(JSON.parse(spy.mock.calls[0]![1]?.body as string)).toEqual({});
  });

  it("URL は /api/me/delete-request 固定", async () => {
    const spy = mockFetch(202, { ...acceptedFixture, type: "delete_request" });
    await requestDelete({ reason: "no longer attend" });
    const [url] = spy.mock.calls[0]!;
    expect(url).toBe("/api/me/delete-request");
  });

  it("409 → DUPLICATE_PENDING_REQUEST", async () => {
    mockFetch(409, { error: "DUPLICATE_PENDING_REQUEST" });
    const res = await requestDelete();
    expect(res).toEqual({
      ok: false,
      code: "DUPLICATE_PENDING_REQUEST",
      status: 409,
    });
  });
});

// 型 shape の最低限 self-check（apps/api 直 import を避けるための代替）
describe("type shape", () => {
  it("VisibilityRequestInput は desiredState 必須 / reason 任意", () => {
    expectTypeOf<VisibilityRequestInput>().toMatchTypeOf<{
      desiredState: "hidden" | "public";
      reason?: string;
    }>();
  });

  it("DeleteRequestInput は reason 任意のみ", () => {
    expectTypeOf<DeleteRequestInput>().toMatchTypeOf<{ reason?: string }>();
  });

  it("QueueAccepted の type は visibility_request | delete_request", () => {
    expectTypeOf<QueueAccepted["type"]>().toEqualTypeOf<
      "visibility_request" | "delete_request"
    >();
  });
});
