"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../components/ui/Toast";
import { FetchAuthedError } from "../../../lib/fetch/errors";

export interface UseAdminMutationOptions<T> {
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly successMessage?: string;
}

export interface UseAdminMutationReturn<T> {
  readonly trigger: (payload: unknown) => Promise<T>;
  readonly isLoading: boolean;
  readonly error: Error | null;
}

export { FetchAuthedError };

export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT",
  options?: UseAdminMutationOptions<T>,
): UseAdminMutationReturn<T> {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isSubmittingRef = useRef(false);

  const trigger = useCallback(
    async (payload: unknown): Promise<T> => {
      if (isSubmittingRef.current) {
        throw new Error("mutation already in flight");
      }
      isSubmittingRef.current = true;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(endpoint, {
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
          throw new Error(msg);
        }
        const data = (await res.json()) as T;
        await options?.onSuccess?.(data);
        router.refresh();
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
