export interface BackoffOptions {
  maxRetry: number;
  baseMs: number;
  maxMs?: number;
  isRetryable?: (err: unknown) => boolean;
  sleep?: (ms: number) => Promise<void>;
  jitter?: () => number;
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
}

export const DEFAULT_BACKOFF: Required<
  Omit<BackoffOptions, "isRetryable" | "onRetry">
> = {
  maxRetry: 5,
  baseMs: 200,
  maxMs: 5_000,
  sleep: (ms: number) => new Promise((r) => setTimeout(r, ms)),
  jitter: () => Math.random(),
};

export class RetryableError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "RetryableError";
  }
}

export async function withBackoff<T>(
  fn: () => Promise<T>,
  opts: Partial<BackoffOptions> = {},
): Promise<T> {
  const merged = { ...DEFAULT_BACKOFF, ...opts };
  const isRetryable = opts.isRetryable ?? ((e) => e instanceof RetryableError);
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= merged.maxRetry) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === merged.maxRetry) throw err;
      const exp = Math.min(
        merged.maxMs,
        merged.baseMs * Math.pow(2, attempt),
      );
      const delayMs = Math.floor(exp * (0.5 + merged.jitter() * 0.5));
      opts.onRetry?.({ attempt: attempt + 1, delayMs, error: err });
      await merged.sleep(delayMs);
      attempt += 1;
    }
  }
  throw lastError;
}
