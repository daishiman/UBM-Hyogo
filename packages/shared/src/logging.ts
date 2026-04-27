export type LogLevel = "error" | "warn" | "info" | "debug";

export interface StructuredLogPayload {
  level: LogLevel;
  timestamp: string;
  traceId?: string;
  code?: string;
  message: string;
  context?: Record<string, unknown>;
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  env?: "production" | "staging" | "development";
  // ApiError.log の追加情報を含める場合に利用
  log?: Record<string, unknown>;
  instance?: string;
}

export type StructuredLogInput = Omit<StructuredLogPayload, "level" | "timestamp">;

const SENSITIVE_KEY_SUBSTRINGS = [
  "authorization",
  "cookie",
  "private_key",
  "client_email",
  "password",
  "token",
  "secret",
  "credential",
  "session",
  "api_key",
  "apikey",
] as const;

const MAX_STRING_LENGTH = 200;

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_SUBSTRINGS.some((s) => lower.includes(s));
}

export function sanitize<T>(value: T): T {
  const seen = new WeakSet<object>();
  function walk(v: unknown, key?: string): unknown {
    if (key !== undefined && isSensitiveKey(key)) return "[REDACTED]";
    if (v === null || v === undefined) return v;
    if (typeof v === "string") {
      return v.length > MAX_STRING_LENGTH
        ? `${v.slice(0, MAX_STRING_LENGTH)}...[truncated:${v.length} chars]`
        : v;
    }
    if (typeof v !== "object") return v;
    if (seen.has(v as object)) return "[Circular]";
    seen.add(v as object);
    if (v instanceof Error) {
      return {
        name: v.name,
        message: v.message.length > MAX_STRING_LENGTH
          ? `${v.message.slice(0, MAX_STRING_LENGTH)}...[truncated]`
          : v.message,
        stackPreview: v.stack?.split("\n").slice(0, 5).join("\n"),
      };
    }
    if (Array.isArray(v)) return v.map((item) => walk(item));
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = walk(val, k);
    }
    return out;
  }
  return walk(value) as T;
}

function emit(level: LogLevel, payload: StructuredLogInput): void {
  const sanitized = sanitize(payload);
  const enriched: StructuredLogPayload = {
    level,
    timestamp: new Date().toISOString(),
    ...sanitized,
  };
  const line = JSON.stringify(enriched);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (level === "info") console.info(line);
  else console.debug(line);
}

export function logError(payload: StructuredLogInput): void {
  emit("error", payload);
}

export function logWarn(payload: StructuredLogInput): void {
  emit("warn", payload);
}

export function logInfo(payload: StructuredLogInput): void {
  emit("info", payload);
}

export function logDebug(payload: StructuredLogInput): void {
  emit("debug", payload);
}
