// serial-05 step-06: useConfirmDialog hook unit tests (Phase 4 U1-U9)
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useConfirmDialog } from "../useConfirmDialog";

afterEach(() => {
  cleanup();
});

describe("useConfirmDialog", () => {
  it("U1: initial state", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useConfirmDialog(onSubmit));
    expect(result.current.open).toBe(false);
    expect(result.current.kind).toBe(null);
    expect(result.current.note).toBe("");
    expect(result.current.submitting).toBe(false);
    expect(result.current.validationError).toBe(null);
  });

  it("U2: openConfirm が kind / context を保持する", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useConfirmDialog(onSubmit));
    act(() => result.current.openConfirm("approve", { foo: 1 }));
    expect(result.current.open).toBe(true);
    expect(result.current.kind).toBe("approve");
    expect(result.current.context).toEqual({ foo: 1 });
  });

  it("U3: setNote が note を反映し validationError を解除する", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useConfirmDialog(onSubmit, { requireNote: true }),
    );
    act(() => result.current.openConfirm("reject"));
    act(() => {
      void result.current.submit(); // validation error 発生
    });
    act(() => result.current.setNote("理由"));
    expect(result.current.note).toBe("理由");
    expect(result.current.validationError).toBe(null);
  });

  it("U4: reject + 空 note で submit すると validationError、onSubmit 未呼出", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useConfirmDialog(onSubmit));
    act(() => result.current.openConfirm("reject"));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.validationError).toBe("理由を入力してください");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("U5: maxNoteLength を超える note で validationError", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useConfirmDialog(onSubmit, { maxNoteLength: 5 }),
    );
    act(() => result.current.openConfirm("delete"));
    act(() => result.current.setNote("123456"));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.validationError).toBe("5文字以内で入力してください");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("U6: 正常 submit は onSubmit 呼出後 state を reset", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useConfirmDialog(onSubmit));
    act(() => result.current.openConfirm("delete", { id: "x" }));
    act(() => result.current.setNote("メモ"));
    await act(async () => {
      await result.current.submit();
    });
    expect(onSubmit).toHaveBeenCalledWith("delete", "メモ", { id: "x" });
    expect(result.current.open).toBe(false);
    expect(result.current.kind).toBe(null);
    expect(result.current.submitting).toBe(false);
  });

  it("U7（改訂）: submit 中の closeConfirm は dialog を閉じ、onCancelMutation 未指定でも安全", async () => {
    let resolveFn: (() => void) | null = null;
    const onSubmit = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        }),
    );
    const { result } = renderHook(() => useConfirmDialog(onSubmit));
    act(() => result.current.openConfirm("delete"));
    let submitPromise: Promise<void>;
    act(() => {
      submitPromise = result.current.submit();
    });
    await waitFor(() => expect(result.current.submitting).toBe(true));
    // 新仕様: submit 中の close = 明示キャンセル → INITIAL に戻る（onCancelMutation 未指定でも例外なし）
    act(() => result.current.closeConfirm());
    expect(result.current.open).toBe(false);
    expect(result.current.submitting).toBe(false);
    expect(result.current.kind).toBe(null);
    // 進行中だった onSubmit の resolve は state を変えない（既に INITIAL）
    await act(async () => {
      resolveFn?.();
      await submitPromise!;
    });
    expect(result.current.open).toBe(false);
  });

  it("U10: submit 中の closeConfirm で onCancelMutation が呼ばれ INITIAL に戻る", async () => {
    let resolveFn: (() => void) | null = null;
    const onSubmit = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        }),
    );
    const onCancelMutation = vi.fn();
    const { result } = renderHook(() =>
      useConfirmDialog(onSubmit, { onCancelMutation }),
    );
    act(() => result.current.openConfirm("delete"));
    let submitPromise: Promise<void>;
    act(() => {
      submitPromise = result.current.submit();
    });
    await waitFor(() => expect(result.current.submitting).toBe(true));
    act(() => result.current.closeConfirm());
    expect(onCancelMutation).toHaveBeenCalledTimes(1);
    expect(result.current.open).toBe(false);
    expect(result.current.kind).toBe(null);
    expect(result.current.submitting).toBe(false);
    await act(async () => {
      resolveFn?.();
      await submitPromise!;
    });
  });

  it("U11: 非 submit 中の closeConfirm では onCancelMutation を呼ばない", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onCancelMutation = vi.fn();
    const { result } = renderHook(() =>
      useConfirmDialog(onSubmit, { onCancelMutation }),
    );
    act(() => result.current.openConfirm("approve"));
    act(() => result.current.closeConfirm());
    expect(onCancelMutation).not.toHaveBeenCalled();
    expect(result.current.open).toBe(false);
    expect(result.current.kind).toBe(null);
  });

  it("U12: rerender で onCancelMutation が差し替わっても最新が呼ばれる", async () => {
    let resolveFn: (() => void) | null = null;
    const onSubmit = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        }),
    );
    const oldFn = vi.fn();
    const newFn = vi.fn();
    const { result, rerender } = renderHook(
      ({ cb }: { cb: () => void }) =>
        useConfirmDialog(onSubmit, { onCancelMutation: cb }),
      { initialProps: { cb: oldFn } },
    );
    act(() => result.current.openConfirm("delete"));
    let submitPromise: Promise<void>;
    act(() => {
      submitPromise = result.current.submit();
    });
    await waitFor(() => expect(result.current.submitting).toBe(true));
    rerender({ cb: newFn });
    act(() => result.current.closeConfirm());
    expect(newFn).toHaveBeenCalledTimes(1);
    expect(oldFn).not.toHaveBeenCalled();
    await act(async () => {
      resolveFn?.();
      await submitPromise!;
    });
  });

  it("U7b: submit 中の二重 submit は no-op", async () => {
    let resolveFn: (() => void) | null = null;
    const onSubmit = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        }),
    );
    const { result } = renderHook(() => useConfirmDialog(onSubmit));
    act(() => result.current.openConfirm("delete"));
    let firstSubmit: Promise<void>;
    act(() => {
      firstSubmit = result.current.submit();
    });
    await waitFor(() => expect(result.current.submitting).toBe(true));
    await act(async () => {
      await result.current.submit();
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveFn?.();
      await firstSubmit!;
    });
  });

  it("U8: onSubmit が throw すると submitting=false に戻り state は保持", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useConfirmDialog(onSubmit));
    act(() => result.current.openConfirm("delete", { id: "x" }));
    act(() => result.current.setNote("メモ"));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.submitting).toBe(false);
    expect(result.current.open).toBe(true);
    expect(result.current.note).toBe("メモ");
    expect(result.current.kind).toBe("delete");
  });

  it("U9: 通常 closeConfirm で完全 reset", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useConfirmDialog(onSubmit));
    act(() => result.current.openConfirm("approve", { foo: 1 }));
    act(() => result.current.setNote("memo"));
    act(() => result.current.closeConfirm());
    expect(result.current.open).toBe(false);
    expect(result.current.kind).toBe(null);
    expect(result.current.note).toBe("");
  });
});
