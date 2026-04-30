// 04a public API への共通 fetcher
// 不変条件 #5: web から D1 直接禁止 → public API 経由のみ
// 不変条件 #10: revalidate で無料枠内に収める

const DEFAULT_BASE_URL = "http://localhost:8787";

function getBaseUrl(): string {
  return process.env.PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
}

export interface FetchPublicOptions extends Omit<RequestInit, "next"> {
  /** revalidate 秒数（Next.js fetch cache）。default 30. */
  revalidate?: number;
}

export async function fetchPublic<T>(
  path: string,
  options: FetchPublicOptions = {},
): Promise<T> {
  const { revalidate = 30, headers, ...rest } = options;
  const url = `${getBaseUrl()}${path}`;
  const r = await fetch(url, {
    ...rest,
    next: { revalidate },
    headers: {
      Accept: "application/json",
      ...(headers ?? {}),
    },
  });
  if (!r.ok) {
    throw new Error(`fetchPublic failed: ${path} ${r.status}`);
  }
  return (await r.json()) as T;
}

export class FetchPublicNotFoundError extends Error {
  constructor(path: string) {
    super(`fetchPublic ${path} 404`);
    this.name = "FetchPublicNotFoundError";
  }
}

/**
 * 404 を専用 error として throw する fetcher。
 * 呼び出し側で try-catch して `notFound()` に変換する。
 */
export async function fetchPublicOrNotFound<T>(
  path: string,
  options: FetchPublicOptions = {},
): Promise<T> {
  const { revalidate = 30, headers, ...rest } = options;
  const url = `${getBaseUrl()}${path}`;
  const r = await fetch(url, {
    ...rest,
    next: { revalidate },
    headers: {
      Accept: "application/json",
      ...(headers ?? {}),
    },
  });
  if (r.status === 404) throw new FetchPublicNotFoundError(path);
  if (!r.ok) throw new Error(`fetchPublic failed: ${path} ${r.status}`);
  return (await r.json()) as T;
}
