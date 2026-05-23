"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../components/ui/Toast";
import { AuthRequiredError, FetchAuthedError } from "../../../lib/fetch/errors";
import { isBrowser } from "../../../lib/is-browser";
import { toLoginRedirect } from "../../../lib/url/login-redirect";

export interface UseAdminMutationOptions<T> {
  readonly mutationFn?: (payload: unknown, endpointOverride?: string) => Promise<T>;
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly successMessage?: string | ((data: T) => string);
  readonly refreshOnSuccess?: boolean;
  readonly redirector?: (url: string) => void;
  readonly currentPath?: string;
}

export interface UseAdminMutationReturn<T> {
  readonly trigger: (payload: unknown, endpointOverride?: string) => Promise<T>;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly reset: () => void;
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

const extractErrorMessage = (bodyText: string): string | null => {
  if (bodyText.length === 0) return null;
  try {
    const body = JSON.parse(bodyText) as { message?: string; error?: string };
    return body.message ?? body.error ?? null;
  } catch {
    return bodyText;
  }
};

const resolveCurrentPath = (currentPath?: string): string => {
  if (currentPath) return currentPath;
  if (!isBrowser()) return "/profile";
  return `${globalThis.location.pathname}${globalThis.location.search}`;
};

const defaultRedirector = (url: string): void => {
  if (!isBrowser()) return;
  globalThis.location.assign(url);
};

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

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    isSubmittingRef.current = false;
  }, []);

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
          const resolvedMessage =
            typeof options.successMessage === "function"
              ? options.successMessage(data)
              : options.successMessage;
          toast(resolvedMessage ?? "✓ 保存しました");
          return data;
        }
        const res = await fetch(endpointOverride ?? endpoint, {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "same-origin",
        });
        if (res.status === 401) {
          throw new AuthRequiredError();
        }
        if (!res.ok) {
          const bodyText = await res.text().catch(() => "");
          throw new FetchAuthedError(res.status, bodyText);
        }
        const data = (await res.json()) as T;
        await options?.onSuccess?.(data);
        if (options?.refreshOnSuccess !== false) router.refresh();
        const resolvedMessage =
          typeof options?.successMessage === "function"
            ? options.successMessage(data)
            : options?.successMessage;
        toast(resolvedMessage ?? "✓ 保存しました");
        return data;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        if (err instanceof AuthRequiredError) {
          const redirector = options?.redirector ?? defaultRedirector;
          redirector(toLoginRedirect(resolveCurrentPath(options?.currentPath)));
        } else if (err instanceof FetchAuthedError) {
          const msg =
            extractErrorMessage(err.bodyText) ??
            (err.status === 403 ? "権限がありません" : "サーバーエラー");
          toast(`✗ ${msg}`, err.status === 403 ? "alert" : "status");
          options?.onError?.(err);
        } else {
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

  return { trigger, isLoading, error, reset };
}
