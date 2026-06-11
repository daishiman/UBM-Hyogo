// 06b: Server Component から API Worker を叩くための fetch helper。
// 不変条件 #5: D1 直接アクセス禁止。すべて API Worker 経由。
// session cookie を上流に転送する（同一ドメイン or signed cookie 想定）。

import { cookies } from "next/headers";

import { getAuthEnv, getEnvironmentResolution, getTransportRuntimeIsTest } from "@/lib/env";
import { AuthRequiredError, FetchAuthedError } from "./errors";
import { describeTransport, fetchViaApiTransport, resolveApiFetch } from "./transport";

export { AuthRequiredError, FetchAuthedError };

const buildCookieHeader = async (): Promise<string> => {
  const store = await cookies();
  const all = store.getAll();
  return all.map((c) => `${c.name}=${c.value}`).join("; ");
};

/**
 * API Worker の `path`（先頭スラッシュ）を叩いて JSON を返す。
 * 401 は AuthRequiredError, それ以外の非 2xx は FetchAuthedError を throw。
 */
export const fetchAuthed = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  if (!path.startsWith("/")) {
    throw new Error(`fetchAuthed: path must start with '/': ${path}`);
  }
  const env = getAuthEnv();
  const environment = getEnvironmentResolution();
  const transport = resolveApiFetch({
    API_SERVICE: env.API_SERVICE,
    baseUrl: env.INTERNAL_API_BASE_URL,
    environment: environment.environment,
    environmentExplicit: environment.explicit,
    isTest: getTransportRuntimeIsTest(),
  });
  const transportDescriptor = describeTransport(transport);
  const cookieHeader = await buildCookieHeader();
  const headers = new Headers(init?.headers);
  if (cookieHeader.length > 0) headers.set("cookie", cookieHeader);
  if (!headers.has("accept")) headers.set("accept", "application/json");

  const res = await fetchViaApiTransport(transport, path, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new AuthRequiredError();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new FetchAuthedError(res.status, text, transportDescriptor);
  }
  return (await res.json()) as T;
};
