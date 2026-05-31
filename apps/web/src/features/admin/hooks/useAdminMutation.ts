"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../components/ui/Toast";
import { AuthRequiredError, FetchAuthedError } from "../../../lib/fetch/errors";
import { isBrowser } from "../../../lib/is-browser";
import { toLoginRedirect } from "../../../lib/url/login-redirect";

/** admin mutation で許可する HTTP method。 */
export type MutationMethod = "POST" | "PATCH" | "PUT" | "DELETE";

/** retry を型レベルで許可する冪等 method。非冪等（POST/PATCH）には retry を渡せない。 */
export type IdempotentMethod = "PUT" | "DELETE";

/** 一過性 5xx / network error への自動再試行ポリシー。idempotent method 限定。 */
export interface RetryPolicy {
  /** 最大試行回数（初回含む）。例: 3 = 初回 + 2 retry */
  readonly maxAttempts: number;
  /** 初回 backoff 遅延 ms（既定 200） */
  readonly baseDelayMs?: number;
  /** backoff 上限 ms（既定 2000） */
  readonly maxDelayMs?: number;
  /**
   * retry するか判定。既定: network error（status null）または 5xx。
   * 4xx は retry しない（冪等でも 4xx は再試行で直らない）。
   */
  readonly retryOn?: (status: number | null) => boolean;
}

/** 404 を成功相当に倒す policy。既定 false（失敗扱い）。 */
export type Treat404AsSuccess = false | "silent" | { readonly toast: string };

export interface UseAdminMutationOptions<T> {
  // --- 既存（不変） ---
  readonly mutationFn?: (payload: unknown, endpointOverride?: string) => Promise<T>;
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly successMessage?: string | ((data: T) => string);
  readonly refreshOnSuccess?: boolean;
  readonly redirector?: (url: string) => void;
  readonly currentPath?: string;
  // --- 新規 policy ---
  /** fetch 打ち切り timeout（ms）。既定 10000。`mutationFn` 経路には適用されない。 */
  readonly timeoutMs?: number;
  /** Idempotency-Key header に送る値。関数なら trigger 毎に評価。指定時のみ送出。 */
  readonly idempotencyKey?: string | (() => string);
  /** 404 を成功相当に倒す policy。既定 false（失敗扱い）。 */
  readonly treat404AsSuccess?: Treat404AsSuccess;
}

/** idempotent method（PUT/DELETE）のときだけ retry を許可する拡張 options。 */
export interface UseAdminMutationIdempotentOptions<T>
  extends UseAdminMutationOptions<T> {
  /** 一過性 5xx / network error への自動再試行。idempotent method 限定・既定オフ。`mutationFn` 経路には適用されない。 */
  readonly retry?: RetryPolicy;
}

export interface UseAdminMutationReturn<T> {
  readonly trigger: (payload: unknown, endpointOverride?: string) => Promise<T>;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly reset: () => void;
  /** 進行中 fetch を AbortController で中断（dialog close 連携用）。AbortError は silent。 */
  readonly abort: () => void;
}

export { FetchAuthedError };

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_BASE_DELAY_MS = 200;
const DEFAULT_MAX_DELAY_MS = 2000;

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

const isIdempotent = (method: MutationMethod): boolean =>
  method === "PUT" || method === "DELETE";

/** runtime ガード（型 + runtime の二重ガード）。retry 未指定 / 非冪等 method では常に false。 */
const shouldRetry = (
  method: MutationMethod,
  retry: RetryPolicy | undefined,
  status: number | null,
): boolean => {
  if (!retry || !isIdempotent(method)) return false;
  const predicate =
    retry.retryOn ?? ((s) => s === null || (s >= 500 && s <= 599));
  return predicate(status);
};

const backoffMs = (attempt: number, retry: RetryPolicy): number => {
  const base = retry.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const max = retry.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  return Math.min(base * 2 ** (attempt - 1), max);
};

const resolveIdempotencyKey = (
  k?: string | (() => string),
): string | undefined => (typeof k === "function" ? k() : k);

const resolveTimeoutMs = (timeoutMs?: number): number =>
  timeoutMs && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// idempotent method（PUT/DELETE）のみ retry 付き options を許可する overload。
export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: IdempotentMethod,
  options?: UseAdminMutationIdempotentOptions<T>,
): UseAdminMutationReturn<T>;
// 非冪等 method（POST/PATCH）は retry を含まない options のみ（POST/PATCH に retry を渡すと型エラー）。
export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: "POST" | "PATCH",
  options?: UseAdminMutationOptions<T>,
): UseAdminMutationReturn<T>;
export function useAdminMutation<T = unknown>(
  endpoint: string,
  method: MutationMethod,
  options?: UseAdminMutationIdempotentOptions<T>,
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
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    isSubmittingRef.current = false;
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // mutationFn 経路 / fetch 200 経路の共通 success 処理（onSuccess → refresh → 既定 toast）。
  const applySuccess = useCallback(
    async (data: T): Promise<void> => {
      await options?.onSuccess?.(data);
      if (options?.refreshOnSuccess !== false) router.refresh();
      const resolvedMessage =
        typeof options?.successMessage === "function"
          ? options.successMessage(data)
          : options?.successMessage;
      toast(resolvedMessage ?? "✓ 保存しました");
    },
    [options, router, toast],
  );

  const trigger = useCallback(
    async (payload: unknown, endpointOverride?: string): Promise<T> => {
      if (isSubmittingRef.current) {
        throw new Error("mutation already in flight");
      }
      isSubmittingRef.current = true;
      setIsLoading(true);
      setError(null);
      const retry = options?.retry;
      const timeoutMs = resolveTimeoutMs(options?.timeoutMs);
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      // 失敗時の共通処理（error 状態保存 → 分岐別 toast/redirect/onError → throw）。
      const handleFailure = (err: Error): never => {
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
      };
      try {
        // mutationFn 経路は signal を受け取れないため timeout/retry/abort 非適用（後方互換）。
        if (options?.mutationFn) {
          try {
            const data = await options.mutationFn(payload, endpointOverride);
            await applySuccess(data);
            return data;
          } catch (e) {
            handleFailure(e instanceof Error ? e : new Error(String(e)));
          }
        }
        let attempt = 0;
        for (;;) {
          const controller = new AbortController();
          abortRef.current = controller;
          timeoutId = setTimeout(() => controller.abort(), timeoutMs);
          try {
            const key = resolveIdempotencyKey(options?.idempotencyKey);
            const res = await fetch(endpointOverride ?? endpoint, {
              method,
              headers: {
                "content-type": "application/json",
                ...(key ? { "Idempotency-Key": key } : {}),
              },
              body: JSON.stringify(payload),
              credentials: "same-origin",
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (res.status === 401) {
              throw new AuthRequiredError();
            }
            // 404 success-relaxation（既定 false。未指定でも失敗扱い）
            if (res.status === 404 && options?.treat404AsSuccess) {
              const policy = options.treat404AsSuccess;
              if (policy !== "silent") toast(policy.toast, "status");
              await options?.onSuccess?.(undefined as T);
              if (options?.refreshOnSuccess !== false) router.refresh();
              return undefined as T;
            }
            if (!res.ok) {
              const bodyText = await res.text().catch(() => "");
              const err = new FetchAuthedError(res.status, bodyText);
              if (
                shouldRetry(method, retry, res.status) &&
                retry &&
                attempt + 1 < retry.maxAttempts
              ) {
                attempt++;
                await sleep(backoffMs(attempt, retry));
                continue;
              }
              throw err;
            }
            const data =
              res.status === 204 ? (undefined as T) : ((await res.json()) as T);
            await applySuccess(data);
            return data;
          } catch (e) {
            clearTimeout(timeoutId);
            // timeout / abort() による中断は silent（toast/onError を出さず error 状態も残さない）。
            // AbortError は jsdom / Workers では DOMException で `instanceof Error` が false
            // になりうるため、ラップ前の raw な name で判定し原 error を再 throw する。
            if ((e as { name?: unknown } | null | undefined)?.name === "AbortError") {
              setError(null);
              throw e;
            }
            const err = e instanceof Error ? e : new Error(String(e));
            // network error（fetch reject・status 不明）のみ retry 対象。
            // 既に HTTP ステータスを持つ typed error は retry 判定済みなのでここでは再試行しない。
            const isTypedHttpError =
              err instanceof FetchAuthedError || err instanceof AuthRequiredError;
            if (
              !isTypedHttpError &&
              shouldRetry(method, retry, null) &&
              retry &&
              attempt + 1 < retry.maxAttempts
            ) {
              attempt++;
              await sleep(backoffMs(attempt, retry));
              continue;
            }
            handleFailure(err);
          }
        }
      } finally {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        isSubmittingRef.current = false;
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [endpoint, method, options, router, toast, applySuccess],
  );

  return { trigger, isLoading, error, reset, abort };
}
