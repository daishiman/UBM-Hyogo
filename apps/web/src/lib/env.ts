import { getCloudflareContext } from "@opennextjs/cloudflare";

export type RuntimeEnvironment = "local" | "staging" | "production";

export type WebEnv = {
  SENTRY_DSN_WEB?: string | undefined;
  SENTRY_ENVIRONMENT: RuntimeEnvironment;
  SENTRY_TRACES_SAMPLE_RATE: number;
  NEXT_PUBLIC_SENTRY_DSN?: string | undefined;
  NEXT_PUBLIC_SENTRY_ENVIRONMENT?: RuntimeEnvironment | undefined;
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: number;
};

type RawEnv = Partial<Record<keyof WebEnv, unknown>>;

export function getEnv(ctx?: { env?: RawEnv }): WebEnv {
  const raw = {
    ...readCloudflareEnv(),
    ...(ctx?.env ?? {}),
  };

  return {
    SENTRY_DSN_WEB: readString(raw.SENTRY_DSN_WEB, process.env.SENTRY_DSN_WEB),
    SENTRY_ENVIRONMENT: readRuntimeEnvironment(
      raw.SENTRY_ENVIRONMENT,
      process.env.SENTRY_ENVIRONMENT,
    ),
    SENTRY_TRACES_SAMPLE_RATE: readSampleRate(
      raw.SENTRY_TRACES_SAMPLE_RATE,
      process.env.SENTRY_TRACES_SAMPLE_RATE,
      0.1,
    ),
    NEXT_PUBLIC_SENTRY_DSN: readString(
      raw.NEXT_PUBLIC_SENTRY_DSN,
      process.env.NEXT_PUBLIC_SENTRY_DSN,
    ),
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: readOptionalRuntimeEnvironment(
      raw.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    ),
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: readSampleRate(
      raw.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
      0.1,
    ),
  };
}

function readCloudflareEnv(): RawEnv {
  try {
    return getCloudflareContext().env as RawEnv;
  } catch {
    return {};
  }
}

function readString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function readRuntimeEnvironment(...values: unknown[]): RuntimeEnvironment {
  return readOptionalRuntimeEnvironment(...values) ?? "local";
}

function readOptionalRuntimeEnvironment(
  ...values: unknown[]
): RuntimeEnvironment | undefined {
  const value = readString(...values);
  if (value === "staging" || value === "production" || value === "local") {
    return value;
  }
  return undefined;
}

function readSampleRate(
  raw: unknown,
  fallback: unknown,
  defaultValue: number,
): number {
  const value = typeof raw === "undefined" ? fallback : raw;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : defaultValue;
}
