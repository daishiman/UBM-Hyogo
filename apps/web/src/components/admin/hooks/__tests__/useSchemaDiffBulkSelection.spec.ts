// Issue #776: useSchemaDiffBulkSelection — selection / modal / submit の単体テスト
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  useSchemaDiffBulkSelection,
  type BulkRowState,
} from "../useSchemaDiffBulkSelection";
import type { SchemaAliasBulkRowResult } from "../../../../lib/admin/api";

const makeRow = (over: Partial<BulkRowState> = {}): BulkRowState => ({
  diffId: over.diffId ?? "d1",
  questionId: over.questionId ?? "q1",
  category: over.category ?? "unresolved",
  suggestedStableKey: over.suggestedStableKey ?? "suggested_key",
  stableKey: over.stableKey ?? "suggested_key",
  submitStatus: "idle",
  errorMessage: undefined,
  ...over,
});

const okResult = (diffId: string, questionId: string): SchemaAliasBulkRowResult => ({
  diffId,
  questionId,
  status: "success",
});

const errResult = (
  diffId: string,
  questionId: string,
  message: string,
): SchemaAliasBulkRowResult => ({
  diffId,
  questionId,
  status: "error",
  error: { kind: "conflict", message, httpStatus: 409 },
});

const retryableResult = (
  diffId: string,
  questionId: string,
): SchemaAliasBulkRowResult => ({
  diffId,
  questionId,
  status: "retryable",
  error: {
    kind: "retryable",
    message: "Back-fill can continue from the last processed row.",
    httpStatus: 202,
  },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSchemaDiffBulkSelection", () => {
  it("HOOK-01 toggle で selectedIds に追加 / 削除", () => {
    const post = vi.fn();
    const onAllSucceeded = vi.fn();
    const { result } = renderHook(() =>
      useSchemaDiffBulkSelection({
        postSchemaAliasBulk: post,
        onAllSucceeded,
      }),
    );
    act(() => result.current.toggle("d1"));
    expect(result.current.selectedIds.has("d1")).toBe(true);
    act(() => result.current.toggle("d1"));
    expect(result.current.selectedIds.has("d1")).toBe(false);
    act(() => result.current.toggle("d1"));
    expect(result.current.selectedIds.has("d1")).toBe(true);
  });

  it("HOOK-02 selectAllInCategory で 当該 ids が全選択", () => {
    const { result } = renderHook(() =>
      useSchemaDiffBulkSelection({
        postSchemaAliasBulk: vi.fn(),
        onAllSucceeded: vi.fn(),
      }),
    );
    act(() =>
      result.current.selectAllInCategory("unresolved", ["d1", "d2", "d3"]),
    );
    expect(result.current.selectedIds.size).toBe(3);
  });

  it("HOOK-03 breakdown が unresolved / changed / total を正しくカウント", () => {
    const categoryOf = (id: string) =>
      id.startsWith("u") ? "unresolved" : "changed";
    const { result } = renderHook(() =>
      useSchemaDiffBulkSelection({
        postSchemaAliasBulk: vi.fn(),
        onAllSucceeded: vi.fn(),
        categoryOf: categoryOf as (
          id: string,
        ) => "unresolved" | "changed" | null,
      }),
    );
    act(() => {
      result.current.toggle("u1");
      result.current.toggle("u2");
      result.current.toggle("c1");
    });
    expect(result.current.breakdown).toEqual({
      unresolved: 2,
      changed: 1,
      total: 3,
    });
  });

  it("HOOK-04 openModal で modalOpen=true & rows 初期化", () => {
    const { result } = renderHook(() =>
      useSchemaDiffBulkSelection({
        postSchemaAliasBulk: vi.fn(),
        onAllSucceeded: vi.fn(),
      }),
    );
    act(() => result.current.openModal([makeRow({ diffId: "x" })]));
    expect(result.current.modalOpen).toBe(true);
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].diffId).toBe("x");
  });

  it("HOOK-05 updateRowStableKey で stableKey が更新", () => {
    const { result } = renderHook(() =>
      useSchemaDiffBulkSelection({
        postSchemaAliasBulk: vi.fn(),
        onAllSucceeded: vi.fn(),
      }),
    );
    act(() => result.current.openModal([makeRow({ diffId: "x" })]));
    act(() => result.current.updateRowStableKey("x", "newKey"));
    expect(result.current.rows[0].stableKey).toBe("newKey");
  });

  it("HOOK-06 applySuggestion で suggestedStableKey を stableKey にセット", () => {
    const { result } = renderHook(() =>
      useSchemaDiffBulkSelection({
        postSchemaAliasBulk: vi.fn(),
        onAllSucceeded: vi.fn(),
      }),
    );
    act(() =>
      result.current.openModal([
        makeRow({
          diffId: "x",
          suggestedStableKey: "sug",
          stableKey: "old",
        }),
      ]),
    );
    act(() => result.current.applySuggestion("x"));
    expect(result.current.rows[0].stableKey).toBe("sug");
  });

  it("HOOK-07 submit 全件成功時 onAllSucceeded が呼ばれ selectedIds がクリア", async () => {
    const onAllSucceeded = vi.fn();
    const post = vi
      .fn()
      .mockResolvedValue({ results: [okResult("d1", "q1"), okResult("d2", "q2")] });
    const { result } = renderHook(() =>
      useSchemaDiffBulkSelection({
        postSchemaAliasBulk: post,
        onAllSucceeded,
      }),
    );
    act(() => {
      result.current.toggle("d1");
      result.current.toggle("d2");
    });
    act(() =>
      result.current.openModal([
        makeRow({ diffId: "d1", questionId: "q1" }),
        makeRow({ diffId: "d2", questionId: "q2" }),
      ]),
    );
    await act(async () => {
      await result.current.submit();
    });
    expect(onAllSucceeded).toHaveBeenCalledTimes(1);
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.modalOpen).toBe(false);
  });

  it("HOOK-08 submit 部分失敗時 失敗行のみ残り submitStatus=error / errorMessage がセット、modal open のまま", async () => {
    const onAllSucceeded = vi.fn();
    const post = vi.fn().mockResolvedValue({
      results: [okResult("d1", "q1"), errResult("d2", "q2", "conflict!")],
    });
    const { result } = renderHook(() =>
      useSchemaDiffBulkSelection({
        postSchemaAliasBulk: post,
        onAllSucceeded,
      }),
    );
    act(() =>
      result.current.openModal([
        makeRow({ diffId: "d1", questionId: "q1" }),
        makeRow({ diffId: "d2", questionId: "q2" }),
      ]),
    );
    await act(async () => {
      await result.current.submit();
    });
    expect(onAllSucceeded).not.toHaveBeenCalled();
    expect(result.current.modalOpen).toBe(true);
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].diffId).toBe("d2");
    expect(result.current.rows[0].submitStatus).toBe("error");
    expect(result.current.rows[0].errorMessage).toBe("conflict!");
  });

  it("HOOK-09 submit retryable continuation → status=retryable で modal に残る", async () => {
    const onAllSucceeded = vi.fn();
    const post = vi.fn().mockResolvedValue({
      results: [retryableResult("d1", "q1")],
    });
    const { result } = renderHook(() =>
      useSchemaDiffBulkSelection({
        postSchemaAliasBulk: post,
        onAllSucceeded,
      }),
    );
    act(() =>
      result.current.openModal([makeRow({ diffId: "d1", questionId: "q1" })]),
    );
    await act(async () => {
      await result.current.submit();
    });
    expect(onAllSucceeded).not.toHaveBeenCalled();
    expect(result.current.modalOpen).toBe(true);
    expect(result.current.rows[0].submitStatus).toBe("retryable");
    expect(result.current.rows[0].errorMessage).toContain("再試行可能");
  });

  it("HOOK-10 submit helper throw 時も modal を復旧し全行 error にする", async () => {
    const onAllSucceeded = vi.fn();
    const post = vi.fn().mockRejectedValue(new Error("bulk helper crashed"));
    const { result } = renderHook(() =>
      useSchemaDiffBulkSelection({
        postSchemaAliasBulk: post,
        onAllSucceeded,
      }),
    );
    act(() =>
      result.current.openModal([
        makeRow({ diffId: "d1", questionId: "q1" }),
        makeRow({ diffId: "d2", questionId: "q2" }),
      ]),
    );
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.modalOpen).toBe(true);
    expect(result.current.rows.map((r) => r.submitStatus)).toEqual([
      "error",
      "error",
    ]);
    expect(result.current.rows[0].errorMessage).toBe("bulk helper crashed");
    expect(onAllSucceeded).not.toHaveBeenCalled();
  });

  it("HOOK-11 submit は stableKey を trim し onRowResult callback を渡す", async () => {
    const post = vi.fn().mockImplementation(async (_payload, options) => {
      const result = okResult("d1", "q1");
      options.onRowResult(result, 0);
      return { results: [result] };
    });
    const { result } = renderHook(() =>
      useSchemaDiffBulkSelection({
        postSchemaAliasBulk: post,
        onAllSucceeded: vi.fn(),
      }),
    );
    act(() =>
      result.current.openModal([
        makeRow({ diffId: "d1", questionId: "q1", stableKey: " trimmed_key " }),
      ]),
    );
    await act(async () => {
      await result.current.submit();
    });
    expect(post.mock.calls[0][0]).toEqual([
      { diffId: "d1", questionId: "q1", stableKey: "trimmed_key" },
    ]);
    expect(typeof post.mock.calls[0][1].onRowResult).toBe("function");
  });
});
