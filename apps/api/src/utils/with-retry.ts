// UT-09: SQLITE_BUSY 等の一時的なエラーに対する exponential backoff utility。
// pure な再試行ラッパー。Workers の setTimeout が利用できる環境を前提とする。

export interface RetryOptions {
  readonly maxRetries: number;
  readonly baseMs: number;
  readonly maxMs?: number;
  readonly isRetryable?: (err: unknown) => boolean;
  readonly sleep?: (ms: number) => Promise<void>;
}

export interface RetryResult<T> {
  readonly value: T;
  readonly attempts: number;
}

export function isSqliteBusy(err: unknown): boolean {
  if (!err) return false;
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return /SQLITE_BUSY|database is locked|D1_ERROR.*locked/i.test(msg);
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<RetryResult<T>> {
  const {
    maxRetries,
    baseMs,
    maxMs = 5_000,
    isRetryable = isSqliteBusy,
    sleep = defaultSleep,
  } = options;

  let attempts = 0;
  let lastError: unknown;

  while (attempts <= maxRetries) {
    try {
      const value = await fn();
      return { value, attempts };
    } catch (err) {
      lastError = err;
      attempts += 1;
      if (attempts > maxRetries || !isRetryable(err)) {
        throw err;
      }
      const delay = Math.min(maxMs, baseMs * 2 ** (attempts - 1));
      // jitter を 0..baseMs/2 で付与し、複数 worker の同期再試行衝突を緩和
      const jitter = Math.floor(Math.random() * Math.max(1, baseMs / 2));
      await sleep(delay + jitter);
    }
  }
  throw lastError;
}
