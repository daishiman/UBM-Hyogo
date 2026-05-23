// 04a public API への共通 fetcher
// 不変条件 #5: web から D1 直接禁止 → public API 経由のみ
// 不変条件 #10: revalidate で無料枠内に収める
//
// 経路:
// 1. production / staging (Cloudflare Workers runtime, isTestOrPlaywright() === false)
//    → service-binding `API_SERVICE.fetch()` を常に優先
//    (同一 account workers.dev への外向き fetch loopback 404 を回避)
// 2. test / Playwright (NODE_ENV=test / PLAYWRIGHT_TEST=1) かつ PUBLIC_API_BASE_URL 明示時
//    → process.env.PUBLIC_API_BASE_URL の HTTP fetch
//    (CI 上の deterministic mock API へ差し替え可能にするため)
// 3. それ以外 (local `next dev` で service binding 不在)
//    → process.env.PUBLIC_API_BASE_URL の HTTP fetch
//
// 注: test runtime 判定 isTestOrPlaywright() は apps/web env 不変条件
// (env 参照は getEnv()/getPublicEnv() 経由) の例外として 1 箇所に閉じる。
// 関連先行: task-05a-fetchpublic-service-binding-001 (逆方向 fallback 設計)

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
  return process.env.PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
}

// test runtime 判定。apps/web env 不変条件(getEnv()/getPublicEnv() 経由) の例外として
// このヘルパ 1 箇所のみで process.env を直参照する。
function isTestOrPlaywright(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.PLAYWRIGHT_TEST === "1"
  );
}

function getServiceBinding(): ServiceBinding | undefined {
  // test/CI 限定: PUBLIC_API_BASE_URL 明示時に HTTP fallback を優先(mock API 差し替えのため)
  if (isTestOrPlaywright() && process.env.PUBLIC_API_BASE_URL) return undefined;
  // production / staging: PUBLIC_API_BASE_URL の有無に関わらず service binding を最優先
  return readEnv().API_SERVICE;
}

function logTransport(transport: "service-binding" | "http-fallback", path: string, status: number) {
  console.log({
    transport,
    path: path.split("?")[0],
    status,
  });
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
    const response = await binding.fetch(url, init);
    logTransport("service-binding", path, response.status);
    return response;
  }
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, init);
  logTransport("http-fallback", path, response.status);
  return response;
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
