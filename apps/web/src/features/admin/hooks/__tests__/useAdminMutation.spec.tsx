// parallel-10 Phase 6 Step 5: useAdminMutation の unit test。
// DI: redirector / toaster / currentPath を test で差し替える。

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

const loggerWarnMock = vi.fn();
vi.mock("../../../../lib/logger", () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarnMock(...args),
  },
}));

import { ToastProvider } from "../../../../components/ui/Toast";
import {
  AdminMutationHttpError,
  useAdminMutation,
  type AdminMutationOptions,
  type AdminMutationResult,
} from "../useAdminMutation";

const fetchMock = vi.fn();

interface CaptureProps {
  readonly options?: AdminMutationOptions<unknown> | undefined;
  readonly onReady: (r: AdminMutationResult<unknown>) => void;
}

function Capture({ options, onReady }: CaptureProps) {
  const result = useAdminMutation("/admin/test", "POST", options);
  onReady(result);
  return null;
}

const renderHook = (
  options?: AdminMutationOptions<unknown>,
): { getResult: () => AdminMutationResult<unknown> } => {
  let latest: AdminMutationResult<unknown> | null = null;
  const onReady = (r: AdminMutationResult<unknown>) => {
    latest = r;
  };
  const wrap = (children: ReactNode) => <ToastProvider>{children}</ToastProvider>;
  render(wrap(<Capture options={options} onReady={onReady} />));
  return {
    getResult: () => {
      if (!latest) throw new Error("hook not ready");
      return latest;
    },
  };
};

const renderHookWithoutProvider = (
  options?: AdminMutationOptions<unknown>,
): { getResult: () => AdminMutationResult<unknown> } => {
  let latest: AdminMutationResult<unknown> | null = null;
  const onReady = (r: AdminMutationResult<unknown>) => {
    latest = r;
  };
  render(<Capture options={options} onReady={onReady} />);
  return {
    getResult: () => {
      if (!latest) throw new Error("hook not ready");
      return latest;
    },
  };
};

beforeEach(() => {
  fetchMock.mockReset();
  loggerWarnMock.mockReset();
  refreshMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => cleanup());

describe("useAdminMutation", () => {
  it("正常系: trigger が resolve すると result を返し router.refresh が呼ばれる", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const onSuccess = vi.fn();
    const { getResult } = renderHook({ onSuccess, currentPath: () => "/admin" });

    let returned: unknown;
    await act(async () => {
      returned = await getResult().trigger({ x: 1 });
    });

    expect(returned).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ x: 1 }),
    });
    expect(getResult().isLoading).toBe(false);
    expect(getResult().error).toBeNull();
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith({ ok: true });
  });

  it("実行中は isLoading=true になり resolve 後 false に戻る", async () => {
    let resolveFetch: ((res: Response) => void) | null = null;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const { getResult } = renderHook({ currentPath: () => "/admin" });

    let promise!: Promise<unknown>;
    act(() => {
      promise = getResult().trigger({ x: 1 });
    });
    expect(getResult().isLoading).toBe(true);

    await act(async () => {
      resolveFetch?.(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      await promise;
    });
    expect(getResult().isLoading).toBe(false);
  });

  it("401: redirector が呼ばれる", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 401 }));
    const redirector = vi.fn();
    const { getResult } = renderHook({
      redirector,
      currentPath: () => "/admin",
    });

    await act(async () => {
      await getResult().trigger({});
    });

    expect(redirector).toHaveBeenCalledWith("/login?redirect=%2Fadmin");
  });

  it("403: toaster('権限がありません', 'alert') が呼ばれ error が格納される", async () => {
    fetchMock.mockResolvedValueOnce(new Response("forbidden", { status: 403 }));
    const toaster = vi.fn();
    const { getResult } = renderHook({ toaster, currentPath: () => "/admin" });

    await act(async () => {
      await getResult().trigger({});
    });

    expect(toaster).toHaveBeenCalledWith("権限がありません", "alert");
    expect(getResult().error).toBeInstanceOf(AdminMutationHttpError);
    expect((getResult().error as AdminMutationHttpError).status).toBe(403);
  });

  it("ToastProvider 未配置でも 403 は throw せず error を格納する", async () => {
    fetchMock.mockResolvedValueOnce(new Response("forbidden", { status: 403 }));
    const { getResult } = renderHookWithoutProvider({ currentPath: () => "/admin" });

    await act(async () => {
      await getResult().trigger({});
    });

    expect(loggerWarnMock).toHaveBeenCalledWith({
      event: "admin-mutation.toast-provider-missing",
      message: "権限がありません",
      variant: "alert",
    });
    expect(getResult().error).toBeInstanceOf(AdminMutationHttpError);
  });

  it("ToastProvider 未配置でも success toast は throw しない", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const { getResult } = renderHookWithoutProvider({
      currentPath: () => "/admin",
      toastMessage: "保存しました",
    });

    await act(async () => {
      await getResult().trigger({});
    });

    expect(loggerWarnMock).toHaveBeenCalledWith({
      event: "admin-mutation.toast-provider-missing",
      message: "保存しました",
      variant: "status",
    });
    expect(getResult().error).toBeNull();
  });

  it("500: error に格納され toaster は呼ばれない", async () => {
    fetchMock.mockResolvedValueOnce(new Response("boom", { status: 500 }));
    const toaster = vi.fn();
    const { getResult } = renderHook({ toaster, currentPath: () => "/admin" });

    await act(async () => {
      await getResult().trigger({});
    });

    expect(toaster).not.toHaveBeenCalled();
    expect(getResult().error).toBeInstanceOf(AdminMutationHttpError);
    expect((getResult().error as AdminMutationHttpError).status).toBe(500);
  });

  it("汎用 Error: error に格納され onError が呼ばれる", async () => {
    const err = new Error("boom");
    fetchMock.mockRejectedValueOnce(err);
    const onError = vi.fn();
    const { getResult } = renderHook({ onError, currentPath: () => "/admin" });

    await act(async () => {
      await getResult().trigger({});
    });

    expect(onError).toHaveBeenCalledWith(err);
    expect(getResult().error).toBe(err);
  });

  it("reset() で error が null に戻る", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    const { getResult } = renderHook({ currentPath: () => "/admin" });

    await act(async () => {
      await getResult().trigger({});
    });
    expect(getResult().error).not.toBeNull();

    act(() => {
      getResult().reset();
    });
    expect(getResult().error).toBeNull();
  });
});
