// 05b-B Phase 4: verifyMagicLink helper unit test。
// 観点: ok / 各 failure reason / 通信失敗 / 想定外 shape の正規化。

import { describe, expect, it, vi } from "vitest";
import {
  verifyMagicLink,
  mapVerifyReasonToLoginError,
  type VerifyFailureReason,
} from "./verify-magic-link";

const VALID_USER = {
  email: "u@example.com",
  memberId: "m_1",
  responseId: "r_1",
  isAdmin: false,
  authGateState: "active" as const,
};

const fakeFetch = (status: number, body: unknown): typeof fetch => {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
};

describe("verifyMagicLink", () => {
  it("ok=true で user を返す", async () => {
    const r = await verifyMagicLink({
      token: "a".repeat(64),
      email: "u@example.com",
      apiBaseUrl: "http://api.test",
      fetchImpl: fakeFetch(200, { ok: true, user: VALID_USER }),
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.user.memberId).toBe("m_1");
  });

  it.each<VerifyFailureReason>([
    "not_found",
    "expired",
    "already_used",
    "resolve_failed",
  ])("ok=false reason=%s をそのまま返す", async (reason) => {
    const r = await verifyMagicLink({
      token: "a".repeat(64),
      email: "u@example.com",
      apiBaseUrl: "http://api.test",
      fetchImpl: fakeFetch(401, { ok: false, reason }),
    });
    expect(r).toEqual({ ok: false, reason });
  });

  it("不明な reason は resolve_failed に丸める", async () => {
    const r = await verifyMagicLink({
      token: "a".repeat(64),
      email: "u@example.com",
      apiBaseUrl: "http://api.test",
      fetchImpl: fakeFetch(401, { ok: false, reason: "weird_unknown" }),
    });
    expect(r).toEqual({ ok: false, reason: "resolve_failed" });
  });

  it("fetch throw 時は temporary_failure", async () => {
    const r = await verifyMagicLink({
      token: "a".repeat(64),
      email: "u@example.com",
      apiBaseUrl: "http://api.test",
      fetchImpl: (async () => {
        throw new Error("net");
      }) as unknown as typeof fetch,
    });
    expect(r).toEqual({ ok: false, reason: "temporary_failure" });
  });

  it("invalid JSON body は temporary_failure", async () => {
    const fetchImpl = (async () =>
      new Response("not-json", { status: 200 })) as unknown as typeof fetch;
    const r = await verifyMagicLink({
      token: "a".repeat(64),
      email: "u@example.com",
      apiBaseUrl: "http://api.test",
      fetchImpl,
    });
    expect(r).toEqual({ ok: false, reason: "temporary_failure" });
  });

  it("ok=true でも user shape が壊れていれば temporary_failure", async () => {
    const r = await verifyMagicLink({
      token: "a".repeat(64),
      email: "u@example.com",
      apiBaseUrl: "http://api.test",
      fetchImpl: fakeFetch(200, { ok: true, user: { email: "x" } }),
    });
    expect(r).toEqual({ ok: false, reason: "temporary_failure" });
  });

  it("呼び出し URL は /auth/magic-link/verify で末尾 slash 除去", async () => {
    const spy = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, user: VALID_USER }), {
        status: 200,
      }),
    );
    await verifyMagicLink({
      token: "a".repeat(64),
      email: "u@example.com",
      apiBaseUrl: "http://api.test/",
      fetchImpl: spy as unknown as typeof fetch,
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const call = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[0]).toBe("http://api.test/auth/magic-link/verify");
    expect(call[1]?.method).toBe("POST");
  });
});

describe("mapVerifyReasonToLoginError", () => {
  it.each<[VerifyFailureReason, string]>([
    ["not_found", "invalid_link"],
    ["expired", "expired"],
    ["already_used", "already_used"],
    ["resolve_failed", "resolve_failed"],
    ["temporary_failure", "temporary_failure"],
  ])("%s -> %s", (reason, expected) => {
    expect(mapVerifyReasonToLoginError(reason)).toBe(expected);
  });
});
