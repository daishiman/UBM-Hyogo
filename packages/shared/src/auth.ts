// 05a/b 共有: Auth.js v5 + JWT session に対応する SessionUser / SessionJwtClaims 型と
// HS256 で JWT を発行/検証する Web Crypto ベースの helper。
// 不変条件 #5 (apps/web から D1 直接アクセス禁止) のため、session callback では
// apps/api の /auth/session-resolve を経由してこの型を満たす SessionUser を返す。
// 不変条件 #7 (memberId と responseId 分離) のため、JWT には memberId のみ含める。
// 不変条件 #11 (admin gate) のため isAdmin を session に含め、provider 不問の構造とする。

import type { MemberId } from "./branded";

/**
 * Auth.js v5 session callback が返す provider 共通の最小 SessionUser。
 * - profile 本文 / responseId / authGateState は含まない（不変条件 #4/#7/#11）
 * - `me/*` API 等で必要な拡張 view model (`responseId` / `authGateState`) は
 *   別名 `SessionUser` (types/viewmodel) として共存している。
 */
export interface AuthSessionUser {
  readonly memberId: MemberId;
  readonly email: string;
  readonly name?: string;
  readonly isAdmin: boolean;
}

export interface SessionJwtClaims {
  readonly sub: string; // = memberId
  readonly memberId: MemberId;
  readonly isAdmin: boolean;
  readonly email: string;
  readonly name?: string;
  readonly iat: number;
  readonly exp: number; // iat + 24h
}

export type GateReason = "unregistered" | "rules_declined" | "deleted";

export interface SessionResolveResponse {
  readonly memberId: MemberId | null;
  readonly isAdmin: boolean;
  readonly gateReason: GateReason | null;
}

// JWT TTL: 24 hours
export const SESSION_JWT_TTL_SECONDS = 24 * 60 * 60;

// ---- base64url helpers (Web Crypto 互換) ---------------------------------

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const base64urlEncode = (bytes: Uint8Array): string => {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const base64urlEncodeJson = (value: unknown): string =>
  base64urlEncode(textEncoder.encode(JSON.stringify(value)));

const base64urlDecode = (input: string): Uint8Array => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((input.length + 3) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
};

const base64urlDecodeJson = <T>(input: string): T =>
  JSON.parse(textDecoder.decode(base64urlDecode(input))) as T;

const importHs256Key = async (
  secret: string,
  usage: "sign" | "verify",
): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );

// ---- sign / verify -------------------------------------------------------

export interface SignJwtInput {
  readonly memberId: MemberId;
  readonly email: string;
  readonly isAdmin: boolean;
  readonly name?: string;
  readonly nowSeconds?: number; // for test
  readonly ttlSeconds?: number; // override (default 24h)
}

export const signSessionJwt = async (
  secret: string,
  input: SignJwtInput,
): Promise<string> => {
  if (!secret) throw new Error("AUTH_SECRET missing");
  const iat = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const exp = iat + (input.ttlSeconds ?? SESSION_JWT_TTL_SECONDS);
  const header = { alg: "HS256", typ: "JWT" } as const;
  const payload: SessionJwtClaims = {
    sub: input.memberId,
    memberId: input.memberId,
    isAdmin: input.isAdmin,
    email: input.email,
    ...(input.name !== undefined ? { name: input.name } : {}),
    iat,
    exp,
  };
  const signingInput = `${base64urlEncodeJson(header)}.${base64urlEncodeJson(payload)}`;
  const key = await importHs256Key(secret, "sign");
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(signingInput),
  );
  return `${signingInput}.${base64urlEncode(new Uint8Array(sigBuf))}`;
};

/**
 * HS256 + AUTH_SECRET で JWT を verify。
 * 失敗時は null を返す（呼び出し側で 401 にする）。
 * - 改ざん（signature mismatch）→ null
 * - 期限切れ → null
 * - JSON parse error → null
 */
export const verifySessionJwt = async (
  token: string,
  secret: string,
  nowSeconds?: number,
): Promise<SessionJwtClaims | null> => {
  if (!secret) return null;
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  try {
    const header = base64urlDecodeJson<{ alg?: string; typ?: string }>(h!);
    if (header.alg !== "HS256") return null;
    const key = await importHs256Key(secret, "verify");
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlDecode(s!) as unknown as BufferSource,
      textEncoder.encode(`${h}.${p}`),
    );
    if (!ok) return null;
    const claims = base64urlDecodeJson<SessionJwtClaims>(p!);
    const now = nowSeconds ?? Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== "number" || claims.exp < now) return null;
    if (typeof claims.memberId !== "string") return null;
    if (typeof claims.isAdmin !== "boolean") return null;
    if (typeof claims.email !== "string") return null;
    return claims;
  } catch {
    return null;
  }
};

export interface AuthJwtLike {
  readonly memberId?: unknown;
  readonly sub?: unknown;
  readonly email?: unknown;
  readonly name?: unknown;
  readonly isAdmin?: unknown;
  readonly iat?: unknown;
}

export const encodeAuthSessionJwt = async (
  secret: string,
  token: AuthJwtLike | undefined,
  ttlSeconds = SESSION_JWT_TTL_SECONDS,
): Promise<string> => {
  const memberId = typeof token?.memberId === "string"
    ? token.memberId
    : typeof token?.sub === "string"
      ? token.sub
      : "";
  const email = typeof token?.email === "string" ? token.email : "";
  if (!memberId || !email) throw new Error("session token missing memberId/email");
  return signSessionJwt(secret, {
    memberId: memberId as MemberId,
    email,
    isAdmin: token?.isAdmin === true,
    ...(typeof token?.name === "string" ? { name: token.name } : {}),
    ...(typeof token?.iat === "number" ? { nowSeconds: token.iat } : {}),
    ttlSeconds,
  });
};

export const decodeAuthSessionJwt = async (
  secret: string,
  token: string | undefined,
): Promise<SessionJwtClaims | null> => {
  if (!token) return null;
  return verifySessionJwt(token, secret);
};
