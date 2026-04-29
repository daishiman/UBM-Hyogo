// 06b: Server Component から API Worker を叩くための fetch helper。
// 不変条件 #5: D1 直接アクセス禁止。すべて API Worker 経由。
// session cookie を上流に転送する（同一ドメイン or signed cookie 想定）。

import { cookies } from "next/headers";

const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const resolveApiBase = (): string => {
  const internal = process.env["INTERNAL_API_BASE_URL"];
  if (internal && internal.length > 0) return internal.replace(/\/$/, "");
  const pub = process.env["PUBLIC_API_BASE_URL"];
  if (pub && pub.length > 0) return pub.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};

export class AuthRequiredError extends Error {
  constructor(message = "AUTH_REQUIRED") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export class FetchAuthedError extends Error {
  readonly status: number;
  readonly bodyText: string;
  constructor(status: number, bodyText: string) {
    super(`fetchAuthed failed: ${status}`);
    this.name = "FetchAuthedError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

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
  const base = resolveApiBase();
  const url = `${base}${path}`;
  const cookieHeader = await buildCookieHeader();
  const headers = new Headers(init?.headers);
  if (cookieHeader.length > 0) headers.set("cookie", cookieHeader);
  if (!headers.has("accept")) headers.set("accept", "application/json");

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new AuthRequiredError();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new FetchAuthedError(res.status, text);
  }
  return (await res.json()) as T;
};
