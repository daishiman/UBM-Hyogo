import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { useAdminMutation } from "../useAdminMutation";
import { ToastProvider } from "../../components/ui/Toast";

afterEach(() => cleanup());

function wrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe("useAdminMutation (G9-8/9)", () => {
  it("正常系: mutationFn を呼び onSuccess が発火する", async () => {
    const onSuccess = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue("ok");
    const { result } = renderHook(() => useAdminMutation({ mutationFn, onSuccess }), { wrapper });
    let value: string | undefined;
    await act(async () => {
      value = await result.current.mutate("input");
    });
    expect(value).toBe("ok");
    expect(onSuccess).toHaveBeenCalledWith("ok", "input");
    expect(result.current.isLoading).toBe(false);
  });

  it("concurrent guard: ongoing 中の 2nd call は undefined を返し mutationFn を再実行しない", async () => {
    let resolve!: (v: string) => void;
    const mutationFn = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const { result } = renderHook(() => useAdminMutation({ mutationFn }), { wrapper });

    let firstPromise!: Promise<string | undefined>;
    act(() => {
      firstPromise = result.current.mutate("a");
    });

    let secondValue: string | undefined = "not-set";
    await act(async () => {
      secondValue = await result.current.mutate("b");
    });
    expect(secondValue).toBeUndefined();
    expect(mutationFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve("done");
      await firstPromise;
    });
  });

  it("error 後の再 submit は阻害しない (G9-9: form state は hook 側で触らない)", async () => {
    const mutationFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("ok");
    const onError = vi.fn();
    const { result } = renderHook(() => useAdminMutation({ mutationFn, onError }), { wrapper });

    await act(async () => {
      const v = await result.current.mutate("a");
      expect(v).toBeUndefined();
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeInstanceOf(Error);

    await act(async () => {
      const v = await result.current.mutate("b");
      expect(v).toBe("ok");
    });
    expect(mutationFn).toHaveBeenCalledTimes(2);
  });

  it("reset で error / isLoading が初期化される", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("x"));
    const { result } = renderHook(() => useAdminMutation({ mutationFn }), { wrapper });
    await act(async () => {
      await result.current.mutate("a");
    });
    expect(result.current.error).toBeTruthy();
    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
