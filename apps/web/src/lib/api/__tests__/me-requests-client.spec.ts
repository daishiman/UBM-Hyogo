// 06b-B U: profile self-service request client helper の単体テスト。

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  requestVisibilityChange,
  requestAccountDeletion,
  SelfRequestError,
} from "../me-requests-client";

const mockFetch = (status: number, body: unknown) => {
  const text = body === undefined ? "" : JSON.stringify(body);
  const fn = vi.fn(async () =>
    new Response(text, {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("me-requests-client / visibility-request", () => {
  it("202 で QueueAcceptedResponse を返す", async () => {
    const f = mockFetch(202, {
      queueId: "q_1",
      type: "visibility_request",
      status: "pending",
      createdAt: "2026-05-02T00:00:00.000Z",
    });
    const res = await requestVisibilityChange({ desiredState: "hidden" });
    expect(res.queueId).toBe("q_1");
    expect(res.type).toBe("visibility_request");
    expect(f).toHaveBeenCalledWith(
      "/api/me/visibility-request",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("409 DUPLICATE_PENDING_REQUEST を SelfRequestError に変換", async () => {
    mockFetch(409, { code: "DUPLICATE_PENDING_REQUEST" });
    await expect(
      requestVisibilityChange({ desiredState: "public" }),
    ).rejects.toMatchObject({
      name: "SelfRequestError",
      status: 409,
      code: "DUPLICATE_PENDING_REQUEST",
    });
  });

  it("403 RULES_CONSENT_REQUIRED を変換", async () => {
    mockFetch(403, { code: "RULES_CONSENT_REQUIRED" });
    await expect(
      requestVisibilityChange({ desiredState: "hidden" }),
    ).rejects.toMatchObject({ code: "RULES_CONSENT_REQUIRED" });
  });

  it("401 UNAUTHENTICATED を変換", async () => {
    mockFetch(401, { code: "UNAUTHENTICATED" });
    await expect(
      requestVisibilityChange({ desiredState: "hidden" }),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("body は JSON で送られ、credentials: same-origin", async () => {
    const f = mockFetch(202, {
      queueId: "q",
      type: "visibility_request",
      status: "pending",
      createdAt: "x",
    });
    await requestVisibilityChange({
      desiredState: "public",
      reason: "再公開希望",
    });
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.credentials).toBe("same-origin");
    expect(JSON.parse(String(init.body))).toEqual({
      desiredState: "public",
      reason: "再公開希望",
    });
  });
});

describe("me-requests-client / delete-request", () => {
  it("空 body でも送信できる", async () => {
    const f = mockFetch(202, {
      queueId: "q_d",
      type: "delete_request",
      status: "pending",
      createdAt: "2026-05-02T00:00:00.000Z",
    });
    const res = await requestAccountDeletion();
    expect(res.type).toBe("delete_request");
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(String(init.body))).toEqual({});
  });

  it("409 を SelfRequestError として throw", async () => {
    mockFetch(409, { code: "DUPLICATE_PENDING_REQUEST" });
    await expect(requestAccountDeletion()).rejects.toBeInstanceOf(
      SelfRequestError,
    );
  });
});
