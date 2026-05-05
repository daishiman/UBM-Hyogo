// u-04: Workers 互換 Sheets API client。googleapis SDK 不使用。
// 既存 jobs/sheets-fetcher.ts (GoogleSheetsFetcher) を内部で再利用する factory。

import {
  GoogleSheetsFetcher,
  SheetsFetchError,
  type SheetsFetcher,
  type SheetsValueRange,
  type SheetsFetcherOptions,
} from "../jobs/sheets-fetcher";

export type { SheetsFetcher, SheetsValueRange };
export { SheetsFetchError };

export interface SheetsClient {
  fetchAll(range: string): Promise<SheetsValueRange>;
  fetchDelta(range: string, cursorIso: string | null): Promise<SheetsValueRange>;
}

export function createSheetsClient(opts: SheetsFetcherOptions): SheetsClient {
  const fetcher = new GoogleSheetsFetcher(opts);
  return {
    async fetchAll(range: string): Promise<SheetsValueRange> {
      return fetcher.fetchRange(range);
    },
    async fetchDelta(
      range: string,
      cursorIso: string | null,
    ): Promise<SheetsValueRange> {
      const all = await fetcher.fetchRange(range);
      if (!cursorIso || !all.values || all.values.length === 0) return all;
      const [header, ...body] = all.values;
      const tsIdx = header.findIndex(
        (h) => h.trim() === "タイムスタンプ" || h.trim().toLowerCase() === "timestamp",
      );
      if (tsIdx < 0) return all;
      const filtered = body.filter((row) => {
        const v = row[tsIdx];
        if (!v) return false;
        // submittedAt >= cursor (同秒取りこぼし防止 = TECH-M-02)
        return v >= cursorIso || normalizeTs(v) >= cursorIso;
      });
      return { ...all, values: [header, ...filtered] };
    },
  };
}

function normalizeTs(s: string): string {
  // YYYY/MM/DD HH:mm:ss -> YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}\/\d{2}\/\d{2}/.test(s)) {
    return s.replace(/\//g, "-").replace(" ", "T");
  }
  return s;
}

export class RateLimitError extends Error {
  constructor(public readonly status: number) {
    super(`rate limit ${status}`);
    this.name = "RateLimitError";
  }
}

export interface BackoffConfig {
  maxRetries: number;
  baseMs: number;
  factor: number;
}

export const DEFAULT_BACKOFF: BackoffConfig = { maxRetries: 3, baseMs: 500, factor: 4 };

export function backoffConfigFromEnv(env: { readonly SYNC_MAX_RETRIES?: string }): BackoffConfig {
  const parsed = Number.parseInt(env.SYNC_MAX_RETRIES ?? "", 10);
  const maxRetries = Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 3) : 3;
  return { ...DEFAULT_BACKOFF, maxRetries };
}

export async function fetchWithBackoff<T>(
  fn: () => Promise<T>,
  config: BackoffConfig = DEFAULT_BACKOFF,
  sleep: (ms: number) => Promise<void> = (ms) =>
    new Promise((r) => setTimeout(r, ms)),
): Promise<{ value: T; retryCount: number }> {
  let attempt = 0;
  let delay = config.baseMs;
  while (true) {
    try {
      const value = await fn();
      return { value, retryCount: attempt };
    } catch (err) {
      const status = (err as { status?: number }).status;
      const retriable =
        err instanceof RateLimitError ||
        (status !== undefined && (status === 429 || status >= 500));
      if (!retriable || attempt >= config.maxRetries) throw err;
      await sleep(delay);
      attempt += 1;
      delay *= config.factor;
    }
  }
}
