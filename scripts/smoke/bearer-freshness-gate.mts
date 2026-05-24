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

// production smoke の bearer allowlist 照合用。session JWT の `sub`（= memberId）を返す。
// `sub` 欠落時は後方互換で `memberId` claim を見る。decode 不能時は null。
export function decodeJwtSubject(token: string): string | null {
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) return null;
  try {
    const payload = decodeBase64urlJson(payloadSegment) as { sub?: unknown; memberId?: unknown };
    if (typeof payload.sub === "string" && payload.sub !== "") return payload.sub;
    if (typeof payload.memberId === "string" && payload.memberId !== "") return payload.memberId;
    return null;
  } catch {
    return null;
  }
}

export type GateMessageLevel = "notice" | "warning" | "error";

export interface GateMessage {
  readonly level: GateMessageLevel;
  readonly text: string;
}

export interface FreshnessGateOutcome {
  readonly exitCode: 0 | 1;
  readonly messages: readonly GateMessage[];
}

// 純粋関数: process.env / exit を触らず gate 判定結果を返す（test 可能化）。
// enforce=false（既定・staging 緩和）では non-fresh を warning として通知しつつ exitCode 0 で続行。
// enforce=true（RUNTIME_SMOKE_FRESHNESS_ENFORCE=1）では従来どおり error + exitCode 1。
export function evaluateFreshnessGate(input: {
  readonly checks: ReadonlyArray<{ readonly label: string; readonly token: string }>;
  readonly thresholdSeconds: number;
  readonly enforce: boolean;
  readonly nowSeconds?: number;
  readonly authPath?: string;
}): FreshnessGateOutcome {
  const messages: GateMessage[] = [
    { level: "notice", text: `runtime-smoke auth path: ${input.authPath ?? "unknown"}` },
  ];
  let anyNonFresh = false;
  for (const check of input.checks) {
    const result = classifyBearerFreshness({
      label: check.label,
      token: check.token,
      thresholdSeconds: input.thresholdSeconds,
      nowSeconds: input.nowSeconds,
    });
    if (result.status === "fresh") {
      messages.push({
        level: "notice",
        text: `${result.label}: fresh seconds_remaining=${result.secondsRemaining} threshold=${input.thresholdSeconds}`,
      });
      continue;
    }
    anyNonFresh = true;
    const remaining = result.secondsRemaining === null ? "unknown" : String(result.secondsRemaining);
    const base =
      `${result.label} is ${result.status}; seconds_remaining=${remaining}; ` +
      "refresh the static bearer or provision the *_AUTH_SECRET to enable minted bearers";
    if (input.enforce) {
      messages.push({ level: "error", text: base });
    } else {
      messages.push({
        level: "warning",
        text: `${base}; freshness enforcement disabled (RUNTIME_SMOKE_FRESHNESS_ENFORCE!=1) so the smoke continues`,
      });
    }
  }
  return { exitCode: input.enforce && anyNonFresh ? 1 : 0, messages };
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

function readEnforce(): boolean {
  const raw = (process.env.RUNTIME_SMOKE_FRESHNESS_ENFORCE ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

// gate が freshness を検査する bearer の env 名一覧。
// 既定は staging の 2 本。production smoke は RUNTIME_SMOKE_BEARER_ENVS で
// PRODUCTION_ADMIN_BEARER,PRODUCTION_ME_BEARER を指定して同じ gate を再利用する。
function readBearerChecks(): Array<{ label: string; token: string }> {
  const raw = process.env.RUNTIME_SMOKE_BEARER_ENVS;
  const names =
    raw && raw.trim() !== ""
      ? raw.split(",").map((s) => s.trim()).filter((s) => s !== "")
      : ["STAGING_ADMIN_BEARER", "STAGING_ME_BEARER"];
  return names.map((name) => ({ label: name, token: process.env[name] ?? "" }));
}

function emit(message: GateMessage): void {
  if (message.level === "error") {
    process.stderr.write(`::error::${message.text}\n`);
  } else if (message.level === "warning") {
    process.stderr.write(`::warning::${message.text}\n`);
  } else {
    process.stdout.write(`${message.text}\n`);
  }
}

function main(): void {
  const outcome = evaluateFreshnessGate({
    checks: readBearerChecks(),
    thresholdSeconds: readThreshold(),
    enforce: readEnforce(),
    authPath: process.env.RUNTIME_SMOKE_AUTH_PATH || "unknown",
  });
  for (const message of outcome.messages) emit(message);
  if (outcome.exitCode !== 0) process.exit(outcome.exitCode);
}

if (import.meta.url === new URL(process.argv[1] ?? "", "file:").href) {
  main();
}
