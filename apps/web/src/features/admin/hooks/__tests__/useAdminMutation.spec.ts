// serial-05-step-01: useAdminMutation hook unit tests
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const toastMock = vi.fn();
vi.mock("../../../../components/ui/Toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

import {
  AuthRequiredError,
  FetchAuthedError,
} from "../../../../lib/fetch/errors";
import { useAdminMutation } from "../useAdminMutation";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
beforeEach(() => {
  refreshMock.mockClear();
  toastMock.mockClear();
});

function mockFetchOnce(response: {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text?: () => Promise<string>;
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValueOnce(response) as unknown as typeof fetch,
  );
}

// signal を記録し、abort されたら reject する fetch mock（Phase 4 §2.1）
function makeAbortableFetch(
  makeAbortError: () => unknown = () =>
    new DOMException("Aborted", "AbortError"),
): {
  fetchMock: ReturnType<typeof vi.fn>;
  capturedSignal: () => AbortSignal | undefined;
} {
  let signal: AbortSignal | undefined;
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    signal = init?.signal ?? undefined;
    return new Promise((_resolve, reject) => {
      signal?.addEventListener("abort", () => {
        reject(makeAbortError());
      });
    });
  });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  return { fetchMock, capturedSignal: () => signal };
}

function getInit(fetchMock: ReturnType<typeof vi.fn>, call = 0): RequestInit {
  return fetchMock.mock.calls[call]?.[1] as RequestInit;
}

function getHeaders(
  fetchMock: ReturnType<typeof vi.fn>,
  call = 0,
): Record<string, string> {
  return (getInit(fetchMock, call)?.headers ?? {}) as Record<string, string>;
}

describe("useAdminMutation", () => {
  it("TC-01: success path calls fetch / onSuccess / router.refresh / toast", async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, note: { id: "n1" } }),
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation<{ ok: boolean }>("/api/admin/members/m1/notes", "POST", {
        onSuccess,
      }),
    );
    await act(async () => {
      await result.current.trigger({ body: "hi" });
    });
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(toastMock).toHaveBeenCalledWith("✓ 保存しました");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("TC-02: server 4xx surfaces message via toast / error state", async () => {
    mockFetchOnce({
      ok: false,
      status: 400,
      json: async () => ({ ok: false, error: "invalid body" }),
      text: async () => JSON.stringify({ ok: false, error: "invalid body" }),
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST"),
    );
    await act(async () => {
      await expect(result.current.trigger({ body: "" })).rejects.toBeInstanceOf(
        FetchAuthedError,
      );
    });
    expect(toastMock).toHaveBeenCalledWith("✗ invalid body", "status");
    expect(refreshMock).not.toHaveBeenCalled();
    expect(result.current.error).toBeInstanceOf(FetchAuthedError);
    expect((result.current.error as FetchAuthedError).bodyText).toContain(
      "invalid body",
    );
  });

  it("TC-03: 401 throws AuthRequiredError and redirects to login", async () => {
    mockFetchOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
      text: async () => "",
    });
    const redirector = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST", {
        currentPath: "/admin/members?tab=notes",
        redirector,
      }),
    );
    await act(async () => {
      await expect(result.current.trigger({ body: "x" })).rejects.toBeInstanceOf(
        AuthRequiredError,
      );
    });
    expect(redirector).toHaveBeenCalledWith(
      "/login?redirect=%2Fadmin%2Fmembers%3Ftab%3Dnotes",
    );
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("TC-04: 403 also throws FetchAuthedError", async () => {
    mockFetchOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
      text: async () => "forbidden",
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST"),
    );
    await act(async () => {
      await expect(result.current.trigger({ body: "x" })).rejects.toBeInstanceOf(
        FetchAuthedError,
      );
    });
    expect(toastMock).toHaveBeenCalledWith("✗ forbidden", "alert");
  });

  it("TC-05: PATCH method sends correct verb", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchSpy as unknown as typeof fetch);
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes/n1", "PATCH"),
    );
    await act(async () => {
      await result.current.trigger({ body: "updated" });
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/members/m1/notes/n1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("TC-06: malformed error json falls back to default message", async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
      text: async () => "",
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST"),
    );
    await act(async () => {
      await expect(result.current.trigger({ body: "x" })).rejects.toBeInstanceOf(
        FetchAuthedError,
      );
    });
    expect(toastMock).toHaveBeenCalledWith("✗ サーバーエラー", "status");
  });

  it("TC-06b: server 5xx throws FetchAuthedError", async () => {
    mockFetchOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
      text: async () => "down",
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST"),
    );
    await act(async () => {
      await expect(result.current.trigger({ body: "x" })).rejects.toBeInstanceOf(
        FetchAuthedError,
      );
    });
    expect(result.current.error).toBeInstanceOf(FetchAuthedError);
  });

  it("TC-07: custom successMessage is used", async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST", {
        successMessage: "更新しました",
      }),
    );
    await act(async () => {
      await result.current.trigger({ body: "x" });
    });
    expect(toastMock).toHaveBeenCalledWith("更新しました");
  });

  it("TC-07b: successMessage が関数なら data を受け取り文字列を返す", async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { idempotent: true } }),
    });
    const { result } = renderHook(() =>
      useAdminMutation<{ ok: boolean; result: { idempotent: boolean } }>(
        "/api/admin/tags/queue/q1/resolve",
        "POST",
        {
          successMessage: (data) =>
            data.result.idempotent ? "既に処理済です" : "承認しました",
        },
      ),
    );
    await act(async () => {
      await result.current.trigger({ action: "confirmed", tagCodes: ["t"] });
    });
    expect(toastMock).toHaveBeenCalledWith("既に処理済です");
  });

  it("TC-08: onError callback fires on failure", async () => {
    mockFetchOnce({
      ok: false,
      status: 422,
      json: async () => ({ message: "validation" }),
      text: async () => JSON.stringify({ message: "validation" }),
    });
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST", { onError }),
    );
    await act(async () => {
      await expect(result.current.trigger({ body: "" })).rejects.toThrow();
    });
    expect(onError).toHaveBeenCalledOnce();
  });

  it("TC-09: concurrent trigger guarded", async () => {
    let resolveFetch: (v: unknown) => void = () => {};
    const fetchPromise = new Promise<unknown>((r) => {
      resolveFetch = r;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(fetchPromise) as unknown as typeof fetch,
    );
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST"),
    );
    await act(async () => {
      void result.current.trigger({ body: "x" });
      await expect(result.current.trigger({ body: "y" })).rejects.toThrow(
        /in flight/,
      );
      resolveFetch({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    });
  });

  it("TC-10: reset clears error and loading state", async () => {
    mockFetchOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
      text: async () => "down",
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST"),
    );
    await act(async () => {
      await expect(result.current.trigger({ body: "x" })).rejects.toThrow();
    });
    expect(result.current.error).toBeInstanceOf(FetchAuthedError);
    act(() => {
      result.current.reset();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  // ── AC-2: timeout 発火（silent） ──────────────────────────────
  it("TC-11: 既定 10000ms 経過で AbortError → toast/onError とも呼ばれない（silent）", async () => {
    vi.useFakeTimers();
    const { capturedSignal } = makeAbortableFetch();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST", { onError }),
    );
    await act(async () => {
      const p = result.current.trigger({});
      const exp = expect(p).rejects.toMatchObject({ name: "AbortError" });
      await vi.advanceTimersByTimeAsync(10001);
      await exp;
    });
    expect(toastMock).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(capturedSignal()?.aborted).toBe(true);
    vi.useRealTimers();
  });

  it("TC-12: timeout 前に解決すれば abort されない（誤発火しない安全側）", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      }) as unknown as typeof fetch,
    );
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST"),
    );
    await act(async () => {
      await result.current.trigger({});
      await vi.advanceTimersByTimeAsync(20000);
    });
    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith("✓ 保存しました");
    expect(result.current.error).toBeNull();
    vi.useRealTimers();
  });

  it("TC-12b: timeoutMs: 0 は仕様どおり既定 10000ms として扱う", async () => {
    vi.useFakeTimers();
    const { capturedSignal } = makeAbortableFetch();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST", { timeoutMs: 0, onError }),
    );
    await act(async () => {
      const p = result.current.trigger({});
      const exp = expect(p).rejects.toMatchObject({ name: "AbortError" });
      await vi.advanceTimersByTimeAsync(9999);
      expect(capturedSignal()?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await exp;
    });
    expect(toastMock).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(capturedSignal()?.aborted).toBe(true);
    vi.useRealTimers();
  });

  // ── AC-1/AC-3: retry（idempotent method 限定） ─────────────────
  it("TC-13: DELETE で 5xx → 再試行 → 成功", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "down",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "DELETE", {
        retry: { maxAttempts: 3, baseDelayMs: 200 },
      }),
    );
    await act(async () => {
      const p = result.current.trigger({});
      await vi.advanceTimersByTimeAsync(200);
      await p;
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(toastMock).toHaveBeenCalledWith("✓ 保存しました");
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(result.current.error).toBeNull();
    vi.useRealTimers();
  });

  it("TC-14: PUT で maxAttempts 到達 → 最終失敗", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "down",
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "PUT", {
        retry: { maxAttempts: 2, baseDelayMs: 200 },
      }),
    );
    await act(async () => {
      const p = result.current.trigger({});
      const exp = expect(p).rejects.toBeInstanceOf(FetchAuthedError);
      await vi.advanceTimersByTimeAsync(200);
      await exp;
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeInstanceOf(FetchAuthedError);
    vi.useRealTimers();
  });

  it("TC-15: 4xx は retry しない", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "bad" }),
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "PUT", {
        retry: { maxAttempts: 3 },
      }),
    );
    await act(async () => {
      await expect(result.current.trigger({})).rejects.toBeInstanceOf(
        FetchAuthedError,
      );
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("TC-16: backoff が baseDelayMs から指数増加する", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "down",
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "DELETE", {
        retry: { maxAttempts: 3, baseDelayMs: 200, maxDelayMs: 2000 },
      }),
    );
    let pExp!: Promise<void>;
    await act(async () => {
      const p = result.current.trigger({});
      pExp = expect(p).rejects.toBeInstanceOf(
        FetchAuthedError,
      ) as unknown as Promise<void>;
      await vi.advanceTimersByTimeAsync(199);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1); // 累計 200 = base*2^0
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(399);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1); // 累計 400 = base*2^1
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await pExp;
    vi.useRealTimers();
  });

  // ── AC-1: idempotency-key 注入 ────────────────────────────────
  it("TC-17: 文字列指定で headers に Idempotency-Key が入る", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST", { idempotencyKey: "key-abc" }),
    );
    await act(async () => {
      await result.current.trigger({});
    });
    expect(getHeaders(fetchMock)["Idempotency-Key"]).toBe("key-abc");
  });

  it("TC-18: 関数指定で trigger 時に評価される", async () => {
    const keyFn = vi.fn(() => "key-fn-1");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST", { idempotencyKey: keyFn }),
    );
    await act(async () => {
      await result.current.trigger({});
    });
    expect(keyFn).toHaveBeenCalled();
    expect(getHeaders(fetchMock)["Idempotency-Key"]).toBe("key-fn-1");
  });

  it("TC-19: 未指定なら Idempotency-Key を含まない", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST"),
    );
    await act(async () => {
      await result.current.trigger({});
    });
    expect(getHeaders(fetchMock)).not.toHaveProperty("Idempotency-Key");
  });

  it("TC-29: idempotencyKey 関数は trigger ごとに再評価され、毎回異なる値を送出できる", async () => {
    let n = 0;
    const keyFn = vi.fn(() => `key-${++n}`);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST", { idempotencyKey: keyFn }),
    );
    await act(async () => {
      await result.current.trigger({});
    });
    await act(async () => {
      await result.current.trigger({});
    });
    expect(keyFn).toHaveBeenCalledTimes(2);
    expect(getHeaders(fetchMock, 0)["Idempotency-Key"]).toBe("key-1");
    expect(getHeaders(fetchMock, 1)["Idempotency-Key"]).toBe("key-2");
  });

  // ── AC-4: treat404AsSuccess 3 値 ──────────────────────────────
  it("TC-20: 既定（false）で 404 は FetchAuthedError throw", async () => {
    mockFetchOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
      text: async () => "not found",
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST"),
    );
    await act(async () => {
      await expect(result.current.trigger({})).rejects.toBeInstanceOf(
        FetchAuthedError,
      );
    });
    expect((result.current.error as FetchAuthedError).status).toBe(404);
    expect(toastMock).toHaveBeenCalled();
  });

  it("TC-21: 'silent' で toast なし success + onSuccess(undefined)", async () => {
    mockFetchOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
      text: async () => "not found",
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST", {
        treat404AsSuccess: "silent",
        onSuccess,
      }),
    );
    await act(async () => {
      await result.current.trigger({});
    });
    expect(toastMock).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith(undefined);
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(result.current.error).toBeNull();
  });

  it("TC-22: { toast } で指定文言が status variant で出る", async () => {
    mockFetchOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
      text: async () => "not found",
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST", {
        treat404AsSuccess: { toast: "既に解除済みです" },
        onSuccess,
      }),
    );
    await act(async () => {
      await result.current.trigger({});
    });
    expect(toastMock).toHaveBeenCalledWith("既に解除済みです", "status");
    expect(onSuccess).toHaveBeenCalledWith(undefined);
    expect(result.current.error).toBeNull();
  });

  // ── AC-2: abort() 連携 ────────────────────────────────────────
  it("TC-23: abort() で進行中 fetch が中断され silent", async () => {
    const { capturedSignal } = makeAbortableFetch();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST", { onError }),
    );
    await act(async () => {
      const p = result.current.trigger({});
      const exp = expect(p).rejects.toMatchObject({ name: "AbortError" });
      result.current.abort();
      await exp;
    });
    expect(toastMock).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(capturedSignal()?.aborted).toBe(true);
  });

  // ── Phase 6: timeout × retry 合成境界 ─────────────────────────
  it("TC-24: retry 試行中の attempt が timeout に達したら silent abort で打ち切り（retry しない）", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "down",
      })
      .mockImplementationOnce((_url: string, init?: RequestInit) => {
        signal = init?.signal ?? undefined;
        return new Promise((_resolve, reject) => {
          signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        });
      });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "DELETE", {
        retry: { maxAttempts: 3, baseDelayMs: 200 },
        timeoutMs: 5000,
        onError,
      }),
    );
    await act(async () => {
      const p = result.current.trigger({});
      const exp = expect(p).rejects.toMatchObject({ name: "AbortError" });
      await vi.advanceTimersByTimeAsync(200); // backoff 消化 → 2 回目 fetch
      await vi.advanceTimersByTimeAsync(5000); // 2 回目の timeout 発火
      await exp;
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(toastMock).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    vi.useRealTimers();
  });

  // ── Phase 6: AbortError 判定の回帰 guard（両系統） ────────────
  it("TC-25: 投げられた error が DOMException でも name==='AbortError' で silent", async () => {
    makeAbortableFetch(() => new DOMException("Aborted", "AbortError"));
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST", { onError }),
    );
    await act(async () => {
      const p = result.current.trigger({});
      const exp = expect(p).rejects.toMatchObject({ name: "AbortError" });
      result.current.abort();
      await exp;
    });
    expect(toastMock).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("TC-26: DOMException 非対応環境フォールバック（plain Error + name='AbortError'）でも silent", async () => {
    makeAbortableFetch(() =>
      Object.assign(new Error("Aborted"), { name: "AbortError" }),
    );
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST", { onError }),
    );
    await act(async () => {
      const p = result.current.trigger({});
      const exp = expect(p).rejects.toMatchObject({ name: "AbortError" });
      result.current.abort();
      await exp;
    });
    expect(toastMock).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  // ── Phase 6: mutationFn 経路で timeout/retry 非適用 ───────────
  it("TC-27: mutationFn 経路は timeoutMs を超えても abort されない", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy as unknown as typeof fetch);
    const mutationFn = vi.fn(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 5000)),
    );
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "POST", { mutationFn, timeoutMs: 1000 }),
    );
    let p!: Promise<unknown>;
    await act(async () => {
      p = result.current.trigger({});
      await vi.advanceTimersByTimeAsync(1001); // timeout 相当時間
      await vi.advanceTimersByTimeAsync(4000); // mutationFn 内 timer 消化
      await p;
    });
    await expect(p).resolves.toMatchObject({ ok: true });
    expect(toastMock).toHaveBeenCalledWith("✓ 保存しました");
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("TC-28: mutationFn 経路では retry が掛からない（idempotent method でも）", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("transient"));
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/x", "DELETE", {
        retry: { maxAttempts: 3 },
        mutationFn,
        onError,
      }),
    );
    await act(async () => {
      await expect(result.current.trigger({})).rejects.toThrow("transient");
    });
    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledOnce();
  });

  // ── AC-3: 型レベルテスト（コンパイル時 assert） ───────────────
  it("TC-TY-01: POST/PATCH に retry を渡すと型エラーになる（コンパイル時）", () => {
    // @ts-expect-error retry not allowed for non-idempotent method (POST)
    void (() => useAdminMutation("/api/admin/x", "POST", { retry: { maxAttempts: 3 } }));
    // @ts-expect-error retry not allowed for non-idempotent method (PATCH)
    void (() => useAdminMutation("/api/admin/x", "PATCH", { retry: { maxAttempts: 3 } }));
    // PUT/DELETE は retry 許可（@ts-expect-error を付けない＝型エラーが出ないことを保証）
    void (() => useAdminMutation("/api/admin/x", "PUT", { retry: { maxAttempts: 3 } }));
    void (() => useAdminMutation("/api/admin/x", "DELETE", { retry: { maxAttempts: 3 } }));
    expect(true).toBe(true);
  });
});
