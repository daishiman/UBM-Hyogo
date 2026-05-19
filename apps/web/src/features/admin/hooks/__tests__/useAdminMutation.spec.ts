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
});
