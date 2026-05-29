import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  PUBLIC_API_BASE_URL: z.string().url(),
  INTERNAL_API_BASE_URL: z.string().url(),
  INTERNAL_AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  SENTRY_DSN_WEB: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]).optional(),
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  CSP_MODE: z.enum(["report-only", "enforce"]).default("report-only"),
});

export type Env = z.infer<typeof EnvSchema>;

const PublicEnvSchema = EnvSchema.pick({
  ENVIRONMENT: true,
  NEXT_PUBLIC_API_BASE_URL: true,
  NEXT_PUBLIC_SENTRY_DSN: true,
});

const SecurityHeaderEnvSchema = EnvSchema.pick({
  NEXT_PUBLIC_API_BASE_URL: true,
  CSP_MODE: true,
});

type RawEnv = Record<string, unknown>;
type ServiceBinding = { fetch: typeof fetch };

const AuthEnvSchema = EnvSchema.pick({
  ENVIRONMENT: true,
  AUTH_SECRET: true,
  AUTH_URL: true,
  GOOGLE_CLIENT_ID: true,
  GOOGLE_CLIENT_SECRET: true,
  AUTH_GOOGLE_ID: true,
  AUTH_GOOGLE_SECRET: true,
  INTERNAL_API_BASE_URL: true,
  INTERNAL_AUTH_SECRET: true,
}).partial();

export type AuthEnv = z.infer<typeof AuthEnvSchema> & {
  API_SERVICE?: ServiceBinding;
};

export interface PublicFetchEnv {
  API_SERVICE?: ServiceBinding;
  PUBLIC_API_BASE_URL?: string;
  NODE_ENV?: string;
  PLAYWRIGHT_TEST?: string;
}

export interface AdminFetchEnv {
  API_SERVICE?: ServiceBinding;
  INTERNAL_API_BASE_URL?: string;
  NODE_ENV?: string;
  PLAYWRIGHT_TEST?: string;
}

export interface ApiBaseEnv {
  INTERNAL_API_BASE_URL?: string;
  PUBLIC_API_BASE_URL?: string;
}

function readCloudflareEnv(): RawEnv | undefined {
  try {
    const ctx = getCloudflareContext();
    return ctx.env as RawEnv;
  } catch {
    return undefined;
  }
}

function readProcessEnv(): RawEnv {
  if (typeof process === "undefined") return {};
  return process.env as RawEnv;
}

export function readRawEnv(): RawEnv {
  const cloudflareEnv = readCloudflareEnv();
  if (cloudflareEnv === undefined) return readProcessEnv();
  // Playwright e2e は webServer (`next dev --webpack`) に
  // INTERNAL_API_BASE_URL=http://127.0.0.1:8787（mock API）等を process.env で注入する。
  // OpenNext dev の cloudflare context は wrangler.toml [vars]（本番 API URL）を返すため、
  // PLAYWRIGHT_TEST=1 のときだけ process.env の上書きを優先し、SSR server-fetch を
  // mock API へ向ける。本番 Workers ランタイムでは process.env に config が無いので影響しない。
  if (readProcessEnv()["PLAYWRIGHT_TEST"] === "1") {
    return { ...cloudflareEnv, ...readProcessEnv() };
  }
  return cloudflareEnv;
}

export function getEnv(rawEnv: RawEnv = readRawEnv()): Env {
  return EnvSchema.parse(rawEnv);
}

export function getPublicEnv(rawEnv: RawEnv = readRawEnv()): Pick<
  Env,
  "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL" | "NEXT_PUBLIC_SENTRY_DSN"
> {
  return PublicEnvSchema.parse(rawEnv);
}

export function getPublicEnvSafe(rawEnv: RawEnv = readRawEnv()): Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL"> | undefined {
  const parsed = PublicEnvSchema.safeParse(rawEnv);
  return parsed.success ? parsed.data : undefined;
}

export function getSecurityHeaderEnv(
  rawEnv: RawEnv = readRawEnv(),
): { cspMode: Env["CSP_MODE"]; apiBaseUrl: Env["NEXT_PUBLIC_API_BASE_URL"] } {
  const parsed = SecurityHeaderEnvSchema.parse(rawEnv);
  return {
    cspMode: parsed.CSP_MODE,
    apiBaseUrl: parsed.NEXT_PUBLIC_API_BASE_URL,
  };
}

export function getAuthEnv(rawEnv: RawEnv = readRawEnv()): AuthEnv {
  const parsed = AuthEnvSchema.safeParse(rawEnv);
  const base = parsed.success ? parsed.data : {};
  const binding = rawEnv["API_SERVICE"];
  if (binding === undefined) return base;
  return { ...base, API_SERVICE: binding as ServiceBinding };
}

export function getApiBaseEnv(rawEnv: RawEnv = readRawEnv()): ApiBaseEnv {
  return {
    ...(typeof rawEnv["INTERNAL_API_BASE_URL"] === "string"
      ? { INTERNAL_API_BASE_URL: rawEnv["INTERNAL_API_BASE_URL"] }
      : {}),
    ...(typeof rawEnv["PUBLIC_API_BASE_URL"] === "string"
      ? { PUBLIC_API_BASE_URL: rawEnv["PUBLIC_API_BASE_URL"] }
      : {}),
  };
}

export function getPublicFetchEnv(rawEnv: RawEnv = readRawEnv()): PublicFetchEnv {
  const processEnv = readProcessEnv();
  const baseUrl =
    typeof processEnv["PUBLIC_API_BASE_URL"] === "string"
      ? processEnv["PUBLIC_API_BASE_URL"]
      : typeof rawEnv["PUBLIC_API_BASE_URL"] === "string"
        ? rawEnv["PUBLIC_API_BASE_URL"]
        : undefined;
  const binding = rawEnv["API_SERVICE"];
  return {
    ...(binding === undefined ? {} : { API_SERVICE: binding as ServiceBinding }),
    ...(baseUrl === undefined ? {} : { PUBLIC_API_BASE_URL: baseUrl }),
    ...(typeof processEnv["NODE_ENV"] === "string" ? { NODE_ENV: processEnv["NODE_ENV"] } : {}),
    ...(typeof processEnv["PLAYWRIGHT_TEST"] === "string"
      ? { PLAYWRIGHT_TEST: processEnv["PLAYWRIGHT_TEST"] }
      : {}),
  };
}

export function getAdminFetchEnv(rawEnv: RawEnv = readRawEnv()): AdminFetchEnv {
  const processEnv = readProcessEnv();
  const baseUrl =
    typeof processEnv["INTERNAL_API_BASE_URL"] === "string"
      ? processEnv["INTERNAL_API_BASE_URL"]
      : typeof rawEnv["INTERNAL_API_BASE_URL"] === "string"
        ? rawEnv["INTERNAL_API_BASE_URL"]
        : undefined;
  const binding = rawEnv["API_SERVICE"];
  return {
    ...(binding === undefined ? {} : { API_SERVICE: binding as ServiceBinding }),
    ...(baseUrl === undefined ? {} : { INTERNAL_API_BASE_URL: baseUrl }),
    ...(typeof processEnv["NODE_ENV"] === "string" ? { NODE_ENV: processEnv["NODE_ENV"] } : {}),
    ...(typeof processEnv["PLAYWRIGHT_TEST"] === "string"
      ? { PLAYWRIGHT_TEST: processEnv["PLAYWRIGHT_TEST"] }
      : {}),
  };
}
