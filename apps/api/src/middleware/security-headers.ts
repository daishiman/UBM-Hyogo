import type { MiddlewareHandler } from "hono";

import type { Env } from "../env";

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
} as const;

export const DEFAULT_HSTS_MAX_AGE = 31_536_000;

export const DEFAULT_NO_STORE_PREFIXES = [
  "/me",
  "/auth",
  "/admin",
  "/internal",
] as const;

export const DEFAULT_CORS_ALLOW_METHODS = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
] as const;

export const DEFAULT_CORS_ALLOW_HEADERS = [
  "Authorization",
  "Content-Type",
  "X-Request-ID",
] as const;

export interface SecurityHeadersOptions {
  readonly hstsMaxAge?: number;
  readonly noStorePrefixes?: readonly string[];
}

export const parseAllowedOrigins = (raw?: string): string[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const isProtectedPath = (
  pathname: string,
  prefixes: readonly string[],
): boolean => {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};

const appendVary = (headers: Headers, value: string): void => {
  const current = headers.get("Vary");
  if (!current) {
    headers.set("Vary", value);
    return;
  }
  const values = current.split(",").map((part) => part.trim().toLowerCase());
  if (!values.includes(value.toLowerCase())) {
    headers.set("Vary", `${current}, ${value}`);
  }
};

export const securityHeaders = (
  options: SecurityHeadersOptions = {},
): MiddlewareHandler<{ Bindings: Env }> => {
  const hstsMaxAge = options.hstsMaxAge ?? DEFAULT_HSTS_MAX_AGE;
  const noStorePrefixes = options.noStorePrefixes ?? DEFAULT_NO_STORE_PREFIXES;
  const hsts = `max-age=${hstsMaxAge}; includeSubDomains`;

  return async (c, next) => {
    await next();

    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      c.res.headers.set(name, value);
    }
    c.res.headers.set("Strict-Transport-Security", hsts);

    if (
      isProtectedPath(new URL(c.req.url).pathname, noStorePrefixes) &&
      !c.res.headers.has("Cache-Control")
    ) {
      c.res.headers.set("Cache-Control", "no-store");
    }
  };
};

export const corsFromEnv = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    const origin = c.req.header("Origin");
    const allowedOrigins = parseAllowedOrigins(c.env.ALLOWED_ORIGINS);
    const isAllowed = origin !== undefined && allowedOrigins.includes(origin);

    if (c.req.method === "OPTIONS") {
      if (!isAllowed) {
        return new Response(null, { status: 204 });
      }

      const headers = new Headers();
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set(
        "Access-Control-Allow-Methods",
        DEFAULT_CORS_ALLOW_METHODS.join(","),
      );
      headers.set(
        "Access-Control-Allow-Headers",
        DEFAULT_CORS_ALLOW_HEADERS.join(","),
      );
      headers.set("Access-Control-Allow-Credentials", "true");
      appendVary(headers, "Access-Control-Request-Headers");
      appendVary(headers, "Origin");
      return new Response(null, { headers, status: 204 });
    }

    await next();

    if (isAllowed) {
      c.res.headers.set("Access-Control-Allow-Origin", origin);
      c.res.headers.set("Access-Control-Allow-Credentials", "true");
      appendVary(c.res.headers, "Origin");
    }
    return;
  };
};
