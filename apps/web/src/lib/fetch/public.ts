// 04a public API への共通 fetcher
// 不変条件 #5: web から D1 直接禁止 → public API 経由のみ
// 不変条件 #10: revalidate で無料枠内に収める
//
// 経路:
// 1. Cloudflare Workers 上 (production/staging) → service-binding `API_SERVICE.fetch()`
//    （同一 account workers.dev への外向き fetch loopback で 404 になる事象を回避）
// 2. それ以外 (local `next dev`) → process.env.PUBLIC_API_BASE_URL の外向き fetch

import { getCloudflareContext } from "@opennextjs/cloudflare";

const DEFAULT_BASE_URL = "http://localhost:8787";

interface ServiceBinding {
  fetch: typeof fetch;
}

interface PublicEnv {
  API_SERVICE?: ServiceBinding;
  PUBLIC_API_BASE_URL?: string;
}

function readEnv(): PublicEnv {
  try {
    return getCloudflareContext().env as PublicEnv;
  } catch {
    return {};
  }
}

function getBaseUrl(): string {
  const env = readEnv();
  return env.PUBLIC_API_BASE_URL ?? process.env.PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
}

function getServiceBinding(): ServiceBinding | undefined {
  return readEnv().API_SERVICE;
}

export interface FetchPublicOptions extends Omit<RequestInit, "next"> {
  /** revalidate 秒数（Next.js fetch cache）。default 30. */
  revalidate?: number;
}

async function doFetch(path: string, init: RequestInit & { next?: { revalidate: number } }) {
  const binding = getServiceBinding();
  if (binding) {
    // service-binding 経由: host は worker 側で無視されるが URL parse のために任意の host を使う
    const url = `https://service-binding.local${path}`;
    return binding.fetch(url, init);
  }
  const url = `${getBaseUrl()}${path}`;
  return fetch(url, init);
}

export async function fetchPublic<T>(
  path: string,
  options: FetchPublicOptions = {},
): Promise<T> {
  const { revalidate = 30, headers, ...rest } = options;
  const r = await doFetch(path, {
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
  const r = await doFetch(path, {
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
