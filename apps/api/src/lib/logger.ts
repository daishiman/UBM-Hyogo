// Structured logger for apps/api.
// 不変条件 #5: ログ経路は apps/api 内で完結し apps/web 側に露出させない。
// PII を絶対に含めない（schema label / stableKey / 件数 / code のみ）。

export interface LogPayload {
  readonly code: string;
  readonly [key: string]: unknown;
}

type LogFn = (payload: LogPayload) => void;

interface LoggerSink {
  warn: LogFn;
  info: LogFn;
  error: LogFn;
}

const defaultSink: LoggerSink = {
  warn: (payload) => {
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify({ level: "warn", ...payload }));
  },
  info: (payload) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ level: "info", ...payload }));
  },
  error: (payload) => {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ level: "error", ...payload }));
  },
};

let sink: LoggerSink = defaultSink;

export function setLoggerSink(next: LoggerSink): void {
  sink = next;
}

export function resetLoggerSink(): void {
  sink = defaultSink;
}

export const logWarn: LogFn = (payload) => sink.warn(payload);
export const logInfo: LogFn = (payload) => sink.info(payload);
export const logError: LogFn = (payload) => sink.error(payload);
