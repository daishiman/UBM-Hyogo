import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  PUBLIC_API_BASE_URL: z.string().url(),
  INTERNAL_API_BASE_URL: z.string().url(),
  AUTH_URL: z.string().url(),
  SENTRY_DSN_WEB: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1),
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
  return readCloudflareEnv() ?? readProcessEnv();
}

export function getEnv(rawEnv: RawEnv = readRawEnv()): Env {
  return EnvSchema.parse(rawEnv);
}

export function getPublicEnv(rawEnv: RawEnv = readRawEnv()): Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL"> {
  return PublicEnvSchema.parse(rawEnv);
}
