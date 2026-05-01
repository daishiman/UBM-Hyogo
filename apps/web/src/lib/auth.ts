// 05a: Auth.js v5 + GoogleProvider 設定
// - session strategy = JWT (HS256 + AUTH_SECRET, 24h)
// - signIn callback で API worker `/auth/session-resolve` を呼び D1 lookup
// - jwt callback で memberId / isAdmin を JWT に積む (#7: responseId は載せない)
// - session callback で SessionUser 構造を返す
//
// 不変条件 #5: web worker から D1 直接アクセス禁止 → fetch 経由のみ
// 不変条件 #11: gateReason ありは session 不発行（false 返す）
//
// secrets:
//   AUTH_SECRET, GOOGLE_CLIENT_ID (= AUTH_GOOGLE_ID), GOOGLE_CLIENT_SECRET (= AUTH_GOOGLE_SECRET),
//   AUTH_URL, INTERNAL_API_BASE_URL, INTERNAL_AUTH_SECRET

import NextAuth, { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import {
  decodeAuthSessionJwt,
  encodeAuthSessionJwt,
  SESSION_JWT_TTL_SECONDS,
  type GateReason,
  type SessionResolveResponse,
} from "@ubm-hyogo/shared";

export interface AuthEnv {
  AUTH_SECRET?: string;
  AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  INTERNAL_API_BASE_URL?: string;
  INTERNAL_AUTH_SECRET?: string;
}

const env = (): AuthEnv =>
  (typeof process !== "undefined" ? (process.env as AuthEnv) : ({} as AuthEnv));

const googleClientId = (e: AuthEnv): string =>
  e.GOOGLE_CLIENT_ID ?? e.AUTH_GOOGLE_ID ?? "";
const googleClientSecret = (e: AuthEnv): string =>
  e.GOOGLE_CLIENT_SECRET ?? e.AUTH_GOOGLE_SECRET ?? "";

/**
 * API worker `/auth/session-resolve` を Worker-to-Worker 認証で呼ぶ。
 * 失敗 / 5xx は unregistered として扱う（#11 fail-closed）。
 */
export const fetchSessionResolve = async (
  email: string,
  e: AuthEnv = env(),
  fetchImpl: typeof fetch = fetch,
): Promise<SessionResolveResponse> => {
  const baseUrl = e.INTERNAL_API_BASE_URL;
  const secret = e.INTERNAL_AUTH_SECRET;
  if (!baseUrl || !secret) {
    return {
      memberId: null,
      isAdmin: false,
      gateReason: "unregistered" satisfies GateReason,
    };
  }
  const url = `${baseUrl.replace(/\/$/, "")}/auth/session-resolve?email=${encodeURIComponent(
    email.trim().toLowerCase(),
  )}`;
  try {
    const res = await fetchImpl(url, {
      headers: { "x-internal-auth": secret },
      // edge runtime: keepalive / cache 無指定で OK
    });
    if (!res.ok) {
      return {
        memberId: null,
        isAdmin: false,
        gateReason: "unregistered" satisfies GateReason,
      };
    }
    return (await res.json()) as SessionResolveResponse;
  } catch {
    return {
      memberId: null,
      isAdmin: false,
      gateReason: "unregistered" satisfies GateReason,
    };
  }
};

export const buildAuthConfig = (
  e: AuthEnv = env(),
  fetchImpl: typeof fetch = fetch,
): NextAuthConfig => ({
  trustHost: true,
  ...(e.AUTH_SECRET ? { secret: e.AUTH_SECRET } : {}),
  session: { strategy: "jwt" as const, maxAge: 24 * 60 * 60 },
  jwt: {
    maxAge: SESSION_JWT_TTL_SECONDS,
    encode: async ({ token, secret, maxAge }) =>
      encodeAuthSessionJwt(
        Array.isArray(secret) ? secret[0] ?? "" : secret,
        token,
        maxAge ?? SESSION_JWT_TTL_SECONDS,
      ),
    decode: async ({ token, secret }) =>
      (await decodeAuthSessionJwt(
        Array.isArray(secret) ? secret[0] ?? "" : secret,
        token,
      )) as JWT | null,
  },
  providers: [
    GoogleProvider({
      clientId: googleClientId(e),
      clientSecret: googleClientSecret(e),
      authorization: { params: { prompt: "select_account" } },
    }),
    // 05b-B: Magic Link 検証は callback route で API worker へ委譲済み。
    // ここではその検証結果（SessionUser）を JSON で受け取り session を確立する。
    CredentialsProvider({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        verifiedUser: { type: "text" },
      },
      async authorize(credentials) {
        const raw = credentials?.["verifiedUser"];
        if (typeof raw !== "string" || raw.length === 0) return null;
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return null;
        }
        if (parsed === null || typeof parsed !== "object") return null;
        const u = parsed as Partial<{
          email: string;
          memberId: string;
          responseId: string;
          isAdmin: boolean;
          authGateState: string;
        }>;
        if (
          typeof u.email !== "string" ||
          typeof u.memberId !== "string" ||
          typeof u.responseId !== "string" ||
          u.email.length === 0 ||
          u.memberId.length === 0 ||
          u.responseId.length === 0
        ) {
          return null;
        }
        return {
          id: u.memberId,
          email: u.email,
          memberId: u.memberId,
          isAdmin: u.isAdmin === true,
        } as { id: string; email: string; memberId: string; isAdmin: boolean };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // 05b-B: magic-link Credentials は authorize() 時点で API worker verify 済み。
      // signIn callback では再度 D1 を引かず、user object をそのまま通す。
      if (account?.provider === "credentials") {
        const u = user as { memberId?: string; isAdmin?: boolean };
        return typeof u.memberId === "string" && u.memberId.length > 0;
      }
      if (account?.provider !== "google") return false;
      const email = (profile?.email ?? user?.email ?? "").trim().toLowerCase();
      const verified =
        (profile as { email_verified?: boolean } | undefined)?.email_verified ?? false;
      if (!email || !verified) {
        return "/login?gate=unregistered";
      }
      const resolved = await fetchSessionResolve(email, e, fetchImpl);
      if (!resolved.memberId) {
        return `/login?gate=${resolved.gateReason ?? "unregistered"}`;
      }
      // jwt callback で拾うために user object に追加プロパティを載せる
      (user as { memberId?: string; isAdmin?: boolean }).memberId = resolved.memberId;
      (user as { memberId?: string; isAdmin?: boolean }).isAdmin = resolved.isAdmin;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as { memberId?: string; isAdmin?: boolean; email?: string; name?: string };
        if (u.memberId) {
          token.sub = u.memberId;
          (token as Record<string, unknown>).memberId = u.memberId;
        }
        (token as Record<string, unknown>).isAdmin = u.isAdmin === true;
        if (u.email) (token as Record<string, unknown>).email = u.email;
        if (u.name) (token as Record<string, unknown>).name = u.name;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as Record<string, unknown>;
      session.user = {
        ...session.user,
        memberId: (t.memberId as string) ?? "",
        isAdmin: t.isAdmin === true,
        email: (t.email as string) ?? session.user?.email ?? "",
        name: (t.name as string | undefined) ?? session.user?.name,
      } as typeof session.user & { memberId: string; isAdmin: boolean };
      return session;
    },
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth(buildAuthConfig());

// Auth.js v5 standard: route handler 用に GET / POST を再 export
export const { GET, POST } = handlers;
