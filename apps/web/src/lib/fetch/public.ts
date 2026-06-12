// 04a public API への共通 fetcher
// 不変条件 #5: web から D1 直接禁止 → public API 経由のみ
// 不変条件 #10: revalidate で無料枠内に収める
//
// 経路:
// 1. production / staging (Cloudflare Workers runtime, isTestOrPlaywright() === false)
//    → service-binding `API_SERVICE.fetch()` を常に優先
//    (同一 account workers.dev への外向き fetch loopback 404 を回避)
// 2. test / Playwright (NODE_ENV=test / PLAYWRIGHT_TEST=1) かつ NEXT_PUBLIC_API_BASE_URL 明示時
//    → env.ts が解決した NEXT_PUBLIC_API_BASE_URL の HTTP fetch
//    (CI 上の deterministic mock API へ差し替え可能にするため)
// 3. それ以外 (local `next dev` で service binding 不在)
//    → env.ts が解決した NEXT_PUBLIC_API_BASE_URL の HTTP fetch
//
// 注: test runtime 判定 isTestOrPlaywright() は apps/web env 不変条件
// (env 参照は env.ts 経由) に従い getPublicFetchEnv() 側に閉じる。
// 関連先行: task-05a-fetchpublic-service-binding-001 (逆方向 fallback 設計)

import { getEnvironment, getPublicFetchEnv } from "../env";
import { resolveServiceBinding, selectAndFetch } from "./transport-select";

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

async function getSessionCookieHeader(): Promise<string | undefined> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const values = SESSION_COOKIE_NAMES.flatMap((name) => {
      const cookie = store.get(name);
      return cookie ? [`${cookie.name}=${encodeURIComponent(cookie.value)}`] : [];
    });
    return values.length > 0 ? values.join("; ") : undefined;
  } catch {
    return undefined;
  }
}

async function buildHeaders(
  headers: HeadersInit | undefined,
): Promise<Record<string, string>> {
  const merged: Record<string, string> = { Accept: "application/json" };
  if (headers instanceof Headers) {
    for (const [key, value] of headers.entries()) {
      merged[key] = value;
    }
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      merged[key] = value;
    }
  } else if (headers) {
    Object.assign(merged, headers);
  }
  const cookie = await getSessionCookieHeader();
  if (cookie && !("Cookie" in merged) && !("cookie" in merged)) {
    merged.Cookie = cookie;
  }
  return merged;
}

function getBaseUrl(): string {
  const env = getPublicFetchEnv();
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL;
  if (baseUrl) return baseUrl;
  if (getEnvironment() === "local") {
    // localhost-allow:local-fallback
    return "http://localhost:8787";
  }
  throw new Error(
    "fetchPublic: API base URL unresolved in non-local runtime (NEXT_PUBLIC_API_BASE_URL must be set)",
  );
}

function isTestOrPlaywright(): boolean {
  const env = getPublicFetchEnv();
  return (
    env.NODE_ENV === "test" ||
    env.PLAYWRIGHT_TEST === "1"
  );
}

function getServiceBinding(): { fetch: typeof fetch } | undefined {
  const env = getPublicFetchEnv();
  // test/CI 限定: NEXT_PUBLIC_API_BASE_URL 明示時に HTTP fallback を優先(mock API 差し替えのため)
  const disableBinding =
    isTestOrPlaywright() &&
    Boolean(env.NEXT_PUBLIC_API_BASE_URL);
  // production / staging: NEXT_PUBLIC_API_BASE_URL の有無に関わらず service binding を最優先
  return resolveServiceBinding({ binding: env.API_SERVICE, disableBinding });
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
  // Playwright e2e (PLAYWRIGHT_TEST=1) では deterministic mock API の状態切替
  // (e.g. setPublicHomeEmpty) を SSR が即座に反映する必要があるため Next.js fetch cache を bypass。
  // production / staging の revalidate 設定は不変。vitest (NODE_ENV=test) はfetcher の cache 引数
  // 自体を assert する spec があるため対象外。
  let effectiveInit = init;
  if (getPublicFetchEnv().PLAYWRIGHT_TEST === "1") {
    const { next: _next, cache: _cache, ...rest } = init;
    effectiveInit = { ...rest, cache: "no-store" };
  }
  const transportResult = await selectAndFetch(
    {
      binding: getServiceBinding(),
      resolveBase: () => getBaseUrl(),
      log: logTransport,
    },
    path,
    effectiveInit,
  );
  if (transportResult.kind === "base-unavailable") {
    throw new Error("fetchPublic base URL unavailable");
  }
  return transportResult.response;
}

export async function fetchPublic<T>(
  path: string,
  options: FetchPublicOptions = {},
): Promise<T> {
  const { revalidate = 30, headers, ...rest } = options;
  const mergedHeaders = await buildHeaders(headers);
  const r = await doFetch(path, {
    ...rest,
    next: { revalidate },
    headers: mergedHeaders,
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
  const mergedHeaders = await buildHeaders(headers);
  const r = await doFetch(path, {
    ...rest,
    next: { revalidate },
    headers: mergedHeaders,
  });
  if (r.status === 404) throw new FetchPublicNotFoundError(path);
  if (!r.ok) throw new Error(`fetchPublic failed: ${path} ${r.status}`);
  return (await r.json()) as T;
}
