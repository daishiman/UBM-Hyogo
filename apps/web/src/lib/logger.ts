import { isBrowser } from "./is-browser";
import { captureException, captureMessage } from "./sentry/capture";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  /** 業務イベント名 (例: "members.list.fetch") */
  event: string;
  /** trace 紐付け用 */
  requestId?: string;
  userId?: string;
  /** 自由 fields。秘匿情報を入れない */
  [key: string]: unknown;
}

export interface Logger {
  debug: (fields: LogFields) => void;
  info: (fields: LogFields) => void;
  warn: (fields: LogFields) => void;
  error: (fields: LogFields & { error?: unknown; err?: unknown }) => void;
  /** 子 logger を作成し、共通 fields をマージする */
  child: (base: Partial<LogFields>) => Logger;
}

const REDACT_KEYS = new Set([
  "email",
  "name",
  "token",
  "secret",
  "dsn",
  "password",
  "authorization",
]);

function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 4) return "[depth-limit]";
  if (value instanceof Error) {
    // Error 自体は redact せず（name は Error class 名で PII ではない）
    return { errorName: value.name, message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) {
    return value.map((v) => redact(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (REDACT_KEYS.has(k.toLowerCase())) {
        out[k] = "***";
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

const RUNTIME_TAG = (): string => {
  if (isBrowser()) return "browser";
  if (
    typeof process !== "undefined" &&
    (process as { env?: Record<string, string> }).env?.NEXT_RUNTIME
  ) {
    return (process as { env: Record<string, string> }).env.NEXT_RUNTIME;
  }
  return "workers";
};

function emit(
  level: LogLevel,
  base: Partial<LogFields>,
  fields: LogFields & { error?: unknown; err?: unknown },
) {
  const merged = { ...base, ...fields };
  const safe = redact(merged) as Record<string, unknown>;
  const payload = {
    level,
    ts: new Date().toISOString(),
    runtime: RUNTIME_TAG(),
    ...safe,
  };

  // Workers では JSON 一行が wrangler tail で最も読みやすい
  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "debug"
          ? console.debug
          : console.info;
  fn(JSON.stringify(payload));

  // Sentry breadcrumb / capture。観測系の失敗をユーザー画面へ伝播させない。
  try {
    if (level === "error") {
      void captureException(fields.error ?? fields.err ?? new Error(fields.event), {
        level: "error",
        tags: { event: fields.event, runtime: String(payload.runtime) },
        extras: payload,
      });
    } else if (level === "warn") {
      void captureMessage(fields.event, {
        level: "warning",
        tags: { event: fields.event },
        extras: payload,
      });
    }
  } catch {
    // capture 側が同期 throw しても logger は throw しない。
  }
}

function build(base: Partial<LogFields>): Logger {
  return {
    debug: (f) => emit("debug", base, f),
    info: (f) => emit("info", base, f),
    warn: (f) => emit("warn", base, f),
    error: (f) => emit("error", base, f),
    child: (more) => build({ ...base, ...more }),
  };
}

export const logger: Logger = build({});
