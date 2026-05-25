import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  PUBLIC_API_BASE_URL: z.string().url(),
  INTERNAL_API_BASE_URL: z.string().url(),
  INTERNAL_AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url(),
  SENTRY_DSN_WEB: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]).optional(),
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

const PublicEnvSchema = EnvSchema.pick({
  ENVIRONMENT: true,
  NEXT_PUBLIC_API_BASE_URL: true,
});

type RawEnv = Record<string, unknown>;

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

export function getPublicEnv(rawEnv: RawEnv = readRawEnv()): Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL"> {
  return PublicEnvSchema.parse(rawEnv);
}

export function getPublicEnvSafe(rawEnv: RawEnv = readRawEnv()): Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL"> | undefined {
  const parsed = PublicEnvSchema.safeParse(rawEnv);
  return parsed.success ? parsed.data : undefined;
}
