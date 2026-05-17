"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../components/ui/Toast";
import { FetchAuthedError } from "../../../lib/fetch/errors";

export interface UseAdminMutationOptions<T> {
  readonly mutationFn?: (payload: unknown, endpointOverride?: string) => Promise<T>;
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly successMessage?: string;
  readonly refreshOnSuccess?: boolean;
}

export interface UseAdminMutationReturn<T> {
  readonly trigger: (payload: unknown, endpointOverride?: string) => Promise<T>;
  readonly isLoading: boolean;
  readonly error: Error | null;
}

export { FetchAuthedError };

export class AdminMutationError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminMutationError";
    this.status = status;
  }
}

export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT",
  options?: UseAdminMutationOptions<T>,
): UseAdminMutationReturn<T> {
  const router = useRouter();
  let toast: (message: string, variant?: "alert" | "status") => void = () => {};
  try {
    toast = useToast().toast;
  } catch {
    // Some focused component tests render mutation users without the app shell.
  }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isSubmittingRef = useRef(false);

  const trigger = useCallback(
    async (payload: unknown, endpointOverride?: string): Promise<T> => {
      if (isSubmittingRef.current) {
        throw new Error("mutation already in flight");
      }
      isSubmittingRef.current = true;
      setIsLoading(true);
      setError(null);
      try {
        if (options?.mutationFn) {
          const data = await options.mutationFn(payload, endpointOverride);
          await options.onSuccess?.(data);
          if (options.refreshOnSuccess !== false) router.refresh();
          toast(options.successMessage ?? "✓ 保存しました");
          return data;
        }
        const res = await fetch(endpointOverride ?? endpoint, {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "same-origin",
        });
        if (res.status === 401 || res.status === 403) {
          throw new FetchAuthedError(res.status, "認証が必要です");
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
            error?: string;
          };
          const msg = body?.message ?? body?.error ?? "サーバーエラー";
          throw new AdminMutationError(res.status, msg);
        }
        const data = (await res.json()) as T;
        await options?.onSuccess?.(data);
        if (options?.refreshOnSuccess !== false) router.refresh();
        toast(options?.successMessage ?? "✓ 保存しました");
        return data;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        if (!(err instanceof FetchAuthedError)) {
          toast(`✗ ${err.message}`);
          options?.onError?.(err);
        }
        throw err;
      } finally {
        isSubmittingRef.current = false;
        setIsLoading(false);
      }
    },
    [endpoint, method, options, router, toast],
  );

  return { trigger, isLoading, error };
}
