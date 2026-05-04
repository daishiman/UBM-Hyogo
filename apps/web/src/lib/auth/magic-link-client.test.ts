// ut-web-cov-03 Phase 5: magic-link-client.ts unit test。
// 観点: state 解釈、202 Accepted 扱い、エラー時の MagicLinkRequestError、JSON 不正時 fallback。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MagicLinkRequestError,
  sendMagicLink,
} from "./magic-link-client";
import {
  mockFetchOnce,
  mockFetchNetworkError,
  restoreFetch,
} from "../../test-utils/fetch-mock";

describe("sendMagicLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    restoreFetch();
  });

  it("200 + state=sent で state を返す", async () => {
    mockFetchOnce({ status: 200, body: { state: "sent", email: "u@example.com" } });
    const r = await sendMagicLink("u@example.com", "/profile");
    expect(r).toEqual({ state: "sent", email: "u@example.com" });
  });

  it("202 Accepted も成功扱い", async () => {
    mockFetchOnce({ status: 202, body: { state: "sent" } });
    const r = await sendMagicLink("u@example.com", "/profile");
    expect(r).toEqual({ state: "sent" });
  });

  it("既知の state はそのまま採用する", async () => {
    mockFetchOnce({ status: 200, body: { state: "unregistered" } });
    const r = await sendMagicLink("u@example.com", "/profile");
    expect(r).toEqual({ state: "unregistered" });
  });

  it("壊れた state は sent fallback", async () => {
    mockFetchOnce({ status: 200, body: { state: "weird-state" } });
    const r = await sendMagicLink("u@example.com", "/profile");
    expect(r).toEqual({ state: "sent" });
  });

  it("email が string でなければ含めない", async () => {
    mockFetchOnce({ status: 200, body: { state: "sent", email: 123 } });
    const r = await sendMagicLink("u@example.com", "/profile");
    expect(r).toEqual({ state: "sent" });
  });

  it("400 で MagicLinkRequestError をthrow", async () => {
    mockFetchOnce({ status: 400, rawBody: "bad request" });
    await expect(
      sendMagicLink("u@example.com", "/profile"),
    ).rejects.toBeInstanceOf(MagicLinkRequestError);
  });

  it("500 で MagicLinkRequestError(status=500)", async () => {
    mockFetchOnce({ status: 500, rawBody: "" });
    try {
      await sendMagicLink("u@example.com", "/profile");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(MagicLinkRequestError);
      expect((e as MagicLinkRequestError).status).toBe(500);
      expect((e as MagicLinkRequestError).message).toBe("HTTP 500");
    }
  });

  it("JSON parse 失敗時は state=sent にフォールバック", async () => {
    mockFetchOnce({ status: 200, rawBody: "not-json" });
    const r = await sendMagicLink("u@example.com", "/profile");
    expect(r).toEqual({ state: "sent" });
  });

  it("network error は素通しで throw する", async () => {
    mockFetchNetworkError();
    await expect(
      sendMagicLink("u@example.com", "/profile"),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it("fetch には POST + JSON body が渡る", async () => {
    const spy = mockFetchOnce({ status: 200, body: { state: "sent" } });
    await sendMagicLink("u@example.com", "/profile");
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/auth/magic-link");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(
      JSON.stringify({ email: "u@example.com", redirect: "/profile" }),
    );
  });
});

describe("MagicLinkRequestError", () => {
  it("name と status を保持する", () => {
    const e = new MagicLinkRequestError(401, "auth required");
    expect(e.name).toBe("MagicLinkRequestError");
    expect(e.status).toBe(401);
    expect(e.message).toBe("auth required");
  });
});
