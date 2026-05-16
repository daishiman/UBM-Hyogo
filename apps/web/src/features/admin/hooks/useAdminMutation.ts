"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toLoginRedirect } from "../../../lib/url/login-redirect";
import {
  useOptionalToast,
  type ToastVariant,
} from "../../../components/ui/Toast";
import { isBrowser } from "../../../lib/is-browser";
import { logger } from "../../../lib/logger";

export interface AdminMutationOptions<T = unknown> {
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly toastMessage?: string;
  readonly redirector?: (url: string) => void;
  readonly toaster?: (message: string, variant?: ToastVariant) => void;
  readonly currentPath?: () => string;
}

export interface AdminMutationResult<T = unknown> {
  readonly trigger: (payload: unknown) => Promise<T | undefined>;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly reset: () => void;
}

const defaultCurrentPath = (): string => {
  if (!isBrowser()) return "/";
  const w = globalThis as unknown as { location: Location };
  return `${w.location.pathname}${w.location.search}`;
};

const defaultRedirector = (url: string): void => {
  if (!isBrowser()) return;
  const w = globalThis as unknown as { location: Location };
  w.location.assign(url);
};

const warnMissingToastProvider = (message: string, variant?: ToastVariant): void => {
  if (process.env["NODE_ENV"] !== "production") {
    logger.warn({
      event: "admin-mutation.toast-provider-missing",
      message,
      variant,
    });
  }
};

const handleAuthRequired = (
  redirector: (url: string) => void,
  currentPath: () => string,
): void => {
  redirector(toLoginRedirect(currentPath()));
};

export class AdminMutationHttpError extends Error {
  readonly status: number;
  readonly bodyText: string;
  constructor(status: number, bodyText: string) {
    super(`admin mutation failed: ${status}`);
    this.name = "AdminMutationHttpError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

const handleForbidden = (
  toaster: (message: string, variant?: "alert" | "status") => void,
  setError: (e: Error) => void,
  err: AdminMutationHttpError,
): void => {
  toaster("権限がありません", "alert");
  setError(err);
};

const handleGeneric = (
  setError: (e: Error) => void,
  onError: ((e: Error) => void) | undefined,
  err: Error,
): void => {
  setError(err);
  onError?.(err);
};

const toAdminProxyPath = (endpoint: string): string => {
  if (endpoint.startsWith("/api/admin/")) return endpoint;
  if (endpoint === "/admin") return "/api/admin";
  if (endpoint.startsWith("/admin/")) return `/api${endpoint}`;
  if (endpoint.startsWith("/")) return `/api/admin${endpoint}`;
  throw new Error(`useAdminMutation: endpoint must start with '/': ${endpoint}`);
};

const callAdminProxy = async <T,>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT",
  payload: unknown,
): Promise<T> => {
  const res = await fetch(toAdminProxyPath(endpoint), {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    throw new AdminMutationHttpError(401, "");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AdminMutationHttpError(res.status, text);
  }
  const text = await res.text();
  if (text.length === 0) return undefined as T;
  return JSON.parse(text) as T;
};

export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT",
  options?: AdminMutationOptions<T>,
): AdminMutationResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toastCtx = useOptionalToast();
  const router = useRouter();

  const redirector = options?.redirector ?? defaultRedirector;
  const toaster = options?.toaster ?? toastCtx?.toast ?? warnMissingToastProvider;
  const currentPath = options?.currentPath ?? defaultCurrentPath;

  const reset = useCallback(() => setError(null), []);

  const trigger = useCallback(
    async (payload: unknown): Promise<T | undefined> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await callAdminProxy<T>(endpoint, method, payload);
        if (options?.toastMessage) toaster(options.toastMessage, "status");
        await options?.onSuccess?.(result);
        router.refresh();
        return result;
      } catch (e) {
        if (e instanceof AdminMutationHttpError && e.status === 401) {
          handleAuthRequired(redirector, currentPath);
          return undefined;
        }
        if (e instanceof AdminMutationHttpError && e.status === 403) {
          handleForbidden(toaster, setError, e);
          return undefined;
        }
        handleGeneric(setError, options?.onError, e as Error);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, method, options, toaster, redirector, currentPath, router],
  );

  return { trigger, isLoading, error, reset };
}
