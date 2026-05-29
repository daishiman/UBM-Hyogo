// issue-958 Track B: useBulkRepublish の sequential 実行 / 進捗 / 失敗継続を検証する。

import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../../../../components/ui/Toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { useBulkRepublish } from "../useBulkRepublish";

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch as unknown as typeof fetch);
});

describe("useBulkRepublish", () => {
  it("全成功: state done / succeeded === total / failures 空", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    const { result } = renderHook(() => useBulkRepublish());

    await act(async () => {
      await result.current.start([
        { memberId: "m1", currentPublishState: "hidden" },
        { memberId: "m2", currentPublishState: "member_only" },
      ]);
    });

    await waitFor(() => {
      expect(result.current.state).toBe("done");
    });
    expect(result.current.progress.total).toBe(2);
    expect(result.current.progress.succeeded).toBe(2);
    expect(result.current.progress.failed).toBe(0);
    expect(result.current.progress.failures.length).toBe(0);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/members/m1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ publishState: "public" }),
      }),
    );
  });

  it("一部失敗: 残りも継続実行され failures に記録される", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ ok: false, error: "boom" }),
        text: async () => JSON.stringify({ ok: false, error: "boom" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    const { result } = renderHook(() => useBulkRepublish());

    await act(async () => {
      await result.current.start([
        { memberId: "m1", currentPublishState: "hidden" },
        { memberId: "m2", currentPublishState: "hidden" },
        { memberId: "m3", currentPublishState: "hidden" },
      ]);
    });

    expect(result.current.progress.succeeded).toBe(2);
    expect(result.current.progress.failed).toBe(1);
    expect(result.current.progress.failures[0]).toEqual({
      memberId: "m2",
      code: "HTTP_500",
      message: "fetchAuthed failed: 500",
    });
  });

  it("reset で initial に戻る", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    const { result } = renderHook(() => useBulkRepublish());
    await act(async () => {
      await result.current.start([
        { memberId: "m1", currentPublishState: "hidden" },
      ]);
    });
    act(() => result.current.reset());
    expect(result.current.state).toBe("idle");
    expect(result.current.progress.total).toBe(0);
  });

  it("空配列は no-op (state は idle のまま)", async () => {
    const { result } = renderHook(() => useBulkRepublish());
    await act(async () => {
      await result.current.start([]);
    });
    expect(result.current.state).toBe("idle");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
