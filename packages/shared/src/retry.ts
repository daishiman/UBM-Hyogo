import { ApiError, type UbmErrorCode } from "./errors";
import { logWarn } from "./logging";

export type RetryClassification = "retry" | "stop";

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  totalTimeoutMs?: number;
  classify: (err: unknown) => RetryClassification;
  signal?: AbortSignal;
  isWorkersRuntime?: boolean;
  failureCode?: UbmErrorCode;
  /** 1 回の sleep が許容される上限。Workers の CPU 制限近接ガード */
  maxDelayPerSleepMs?: number;
}

const DEFAULT_MAX_DELAY_PER_SLEEP_MS = 200;
const WORKERS_MAX_ATTEMPTS_CAP = 2;

export function defaultClassify(err: unknown): RetryClassification {
  if (err instanceof ApiError) {
    if (err.code === "UBM-6001" || err.code === "UBM-6002" || err.code === "UBM-6003") {
      return "retry";
    }
    return "stop";
  }
  if (err instanceof TypeError && /fetch failed/i.test(err.message)) return "retry";
  const msg = err instanceof Error ? err.message : String(err);
  if (/\b(5\d{2}|429)\b/.test(msg)) return "retry";
  if (/timeout/i.test(msg)) return "retry";
  return "stop";
}

export const SHEETS_RETRY_PRESET = {
  maxAttempts: 2,
  baseDelayMs: 100,
  totalTimeoutMs: 800,
  classify: defaultClassify,
  failureCode: "UBM-6001",
} as const satisfies RetryOptions;

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(id);
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };
    const cleanup = () => signal?.removeEventListener("abort", onAbort);
    signal?.addEventListener("abort", onAbort);
  });
}

function abortError(cause?: unknown, context?: Record<string, unknown>): ApiError {
  return new ApiError({
    code: "UBM-6002",
    log: {
      cause,
      context: {
        aborted_by_runtime: true,
        ...context,
      },
    },
  });
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const isWorkers = opts.isWorkersRuntime ?? true;
  const requestedMax = opts.maxAttempts;
  const effectiveMaxAttempts = isWorkers
    ? Math.min(requestedMax, WORKERS_MAX_ATTEMPTS_CAP)
    : requestedMax;
  if (isWorkers && requestedMax > WORKERS_MAX_ATTEMPTS_CAP) {
    logWarn({
      message: `withRetry maxAttempts capped at ${WORKERS_MAX_ATTEMPTS_CAP} in Workers runtime`,
      context: { requested: requestedMax, effective: effectiveMaxAttempts },
    });
  }
  const maxDelayPerSleep = opts.maxDelayPerSleepMs ?? DEFAULT_MAX_DELAY_PER_SLEEP_MS;
  const failureCode = opts.failureCode ?? "UBM-6001";
  const startedAt = Date.now();

  let lastError: unknown;

  for (let attempt = 0; attempt < effectiveMaxAttempts; attempt++) {
    if (opts.signal?.aborted) {
      throw abortError(undefined, {
        attempts: attempt,
        maxAttempts: effectiveMaxAttempts,
        requestedMaxAttempts: requestedMax,
      });
    }
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      const classification = opts.classify(err);
      if (classification === "stop") {
        throw err;
      }
      const isLastAttempt = attempt + 1 >= effectiveMaxAttempts;
      if (isLastAttempt) break;
      // タイムアウト判定（次回スリープ前にチェック）
      if (opts.totalTimeoutMs !== undefined && Date.now() - startedAt > opts.totalTimeoutMs) {
        throw new ApiError({
          code: "UBM-6002",
          log: {
            cause: err,
            context: {
              attempts: attempt + 1,
              totalTimeoutMs: opts.totalTimeoutMs,
            },
          },
        });
      }
      const requestedDelay = opts.baseDelayMs * 2 ** attempt;
      let actualDelay = requestedDelay;
      if (requestedDelay > maxDelayPerSleep) {
        logWarn({
          message: `withRetry delay capped to ${maxDelayPerSleep}ms (Workers constraint)`,
          context: { requestedDelay, maxDelayPerSleep, attempt },
        });
        actualDelay = maxDelayPerSleep;
      }
      try {
        await delay(actualDelay, opts.signal);
      } catch (delayErr) {
        throw abortError(delayErr, {
          attempts: attempt + 1,
          maxAttempts: effectiveMaxAttempts,
          requestedMaxAttempts: requestedMax,
        });
      }
      // sleep 後の totalTimeoutMs / abort 再チェック
      if (opts.signal?.aborted) {
        throw abortError(err, {
          attempts: attempt + 1,
          maxAttempts: effectiveMaxAttempts,
          requestedMaxAttempts: requestedMax,
        });
      }
      if (opts.totalTimeoutMs !== undefined && Date.now() - startedAt > opts.totalTimeoutMs) {
        throw new ApiError({
          code: "UBM-6002",
          log: {
            cause: err,
            context: {
              attempts: attempt + 1,
              totalTimeoutMs: opts.totalTimeoutMs,
            },
          },
        });
      }
    }
  }

  throw new ApiError({
    code: failureCode,
    log: {
      cause: lastError,
      context: {
        attempts: effectiveMaxAttempts,
        maxAttempts: effectiveMaxAttempts,
        requestedMaxAttempts: requestedMax,
      },
    },
  });
}
