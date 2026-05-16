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

import { useAdminMutation, FetchAuthedError } from "../useAdminMutation";

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
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST"),
    );
    await act(async () => {
      await expect(result.current.trigger({ body: "" })).rejects.toThrow(
        "invalid body",
      );
    });
    expect(toastMock).toHaveBeenCalledWith("✗ invalid body");
    expect(refreshMock).not.toHaveBeenCalled();
    expect(result.current.error?.message).toBe("invalid body");
  });

  it("TC-02b: known admin error codes are mapped for operators", async () => {
    mockFetchOnce({
      ok: false,
      status: 409,
      json: async () => ({ ok: false, error: "ALREADY_MERGED" }),
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/identity-conflicts/m1__m2/merge", "POST"),
    );
    await act(async () => {
      await expect(result.current.trigger({ reason: "x" })).rejects.toThrow(
        "すでに統合済みです",
      );
    });
    expect(toastMock).toHaveBeenCalledWith("✗ すでに統合済みです");
    expect(result.current.error?.message).toBe("すでに統合済みです");
  });

  it("TC-03: 401 throws FetchAuthedError and does not show generic toast", async () => {
    mockFetchOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST"),
    );
    await act(async () => {
      await expect(result.current.trigger({ body: "x" })).rejects.toBeInstanceOf(
        FetchAuthedError,
      );
    });
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("TC-04: 403 also throws FetchAuthedError", async () => {
    mockFetchOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST"),
    );
    await act(async () => {
      await expect(result.current.trigger({ body: "x" })).rejects.toBeInstanceOf(
        FetchAuthedError,
      );
    });
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
    });
    const { result } = renderHook(() =>
      useAdminMutation("/api/admin/members/m1/notes", "POST"),
    );
    await act(async () => {
      await expect(result.current.trigger({ body: "x" })).rejects.toThrow(
        "サーバーエラー",
      );
    });
    expect(toastMock).toHaveBeenCalledWith("✗ サーバーエラー");
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

  it("TC-08: onError callback fires on failure", async () => {
    mockFetchOnce({
      ok: false,
      status: 422,
      json: async () => ({ message: "validation" }),
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
});
