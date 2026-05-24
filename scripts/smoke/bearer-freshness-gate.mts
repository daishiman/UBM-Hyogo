interface JwtFreshness {
  readonly label: string;
  readonly exp: number | null;
  readonly secondsRemaining: number | null;
  readonly status: "fresh" | "stale" | "expired" | "invalid";
}

const DEFAULT_THRESHOLD_SECONDS = 21_600;

function decodeBase64urlJson(segment: string): unknown {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

export function decodeJwtExp(token: string): number | null {
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) return null;
  try {
    const payload = decodeBase64urlJson(payloadSegment) as { exp?: unknown };
    return typeof payload.exp === "number" && Number.isFinite(payload.exp) ? payload.exp : null;
  } catch {
    return null;
  }
}

export function classifyBearerFreshness(input: {
  readonly label: string;
  readonly token: string;
  readonly nowSeconds?: number;
  readonly thresholdSeconds?: number;
}): JwtFreshness {
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const thresholdSeconds = input.thresholdSeconds ?? DEFAULT_THRESHOLD_SECONDS;
  const exp = decodeJwtExp(input.token);
  if (exp === null) {
    return { label: input.label, exp, secondsRemaining: null, status: "invalid" };
  }

  const secondsRemaining = exp - nowSeconds;
  if (secondsRemaining <= 0) {
    return { label: input.label, exp, secondsRemaining, status: "expired" };
  }
  if (secondsRemaining < thresholdSeconds) {
    return { label: input.label, exp, secondsRemaining, status: "stale" };
  }
  return { label: input.label, exp, secondsRemaining, status: "fresh" };
}

export function explainAuthFailureFromBearer(input: {
  readonly token: string;
  readonly nowSeconds?: number;
}): "auth-token-expired" | "auth-secret-drift" {
  const exp = decodeJwtExp(input.token);
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (exp !== null && exp <= nowSeconds) {
    return "auth-token-expired";
  }
  return "auth-secret-drift";
}

function readThreshold(): number {
  const raw = process.env.FRESHNESS_THRESHOLD_SECONDS;
  if (!raw) return DEFAULT_THRESHOLD_SECONDS;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    process.stderr.write("bearer-freshness-gate: FRESHNESS_THRESHOLD_SECONDS must be a positive integer\n");
    process.exit(2);
  }
  return parsed;
}

function main(): void {
  const thresholdSeconds = readThreshold();
  const authPath = process.env.RUNTIME_SMOKE_AUTH_PATH || "unknown";
  const checks = [
    { label: "STAGING_ADMIN_BEARER", token: process.env.STAGING_ADMIN_BEARER ?? "" },
    { label: "STAGING_ME_BEARER", token: process.env.STAGING_ME_BEARER ?? "" },
  ];

  let failed = false;
  process.stdout.write(`runtime-smoke auth path: ${authPath}\n`);
  for (const check of checks) {
    const result = classifyBearerFreshness({
      label: check.label,
      token: check.token,
      thresholdSeconds,
    });
    if (result.status === "fresh") {
      process.stdout.write(
        `${result.label}: fresh seconds_remaining=${result.secondsRemaining} threshold=${thresholdSeconds}\n`,
      );
      continue;
    }

    failed = true;
    const remaining = result.secondsRemaining === null ? "unknown" : String(result.secondsRemaining);
    process.stderr.write(
      `::error::${result.label} is ${result.status}; seconds_remaining=${remaining}; ` +
        `refresh the static bearer or provision STAGING_AUTH_SECRET to enable minted bearers\n`,
    );
  }

  if (failed) process.exit(1);
}

if (import.meta.url === new URL(process.argv[1] ?? "", "file:").href) {
  main();
}
