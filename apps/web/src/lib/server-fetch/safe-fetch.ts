import type { SafeResult, SafeResultError } from "../result";
import type { ApiTransportDescriptor } from "../fetch/transport";

type RethrowableError = new (...args: never[]) => Error;

export interface SafeServerFetchOptions {
  readonly codePrefix?: string;
  readonly rethrowOn?: ReadonlyArray<RethrowableError>;
  readonly unknownMessage?: string;
  readonly logPath?: string;
}

const STATUS_FROM_MESSAGE = /\bfailed:?\b.*\b(\d{3})\b/;

function statusFromError(err: Error): number | null {
  const status = (err as { readonly status?: unknown }).status;
  if (typeof status === "number" && Number.isInteger(status)) return status;

  const match = err.message.match(STATUS_FROM_MESSAGE);
  return match ? Number(match[1]) : null;
}

function transportFromError(err: Error): ApiTransportDescriptor | undefined {
  const transport = (err as { readonly transport?: unknown }).transport;
  if (transport === null || typeof transport !== "object") return undefined;
  const candidate = transport as {
    readonly transportKind?: unknown;
    readonly baseHost?: unknown;
  };
  if (
    (candidate.transportKind === "service-binding" || candidate.transportKind === "http") &&
    typeof candidate.baseHost === "string"
  ) {
    return {
      transportKind: candidate.transportKind,
      baseHost: candidate.baseHost,
    };
  }
  return undefined;
}

function shouldRethrow(
  err: unknown,
  rethrowOn: ReadonlyArray<RethrowableError>,
): boolean {
  return err instanceof Error && rethrowOn.some((klass) => err instanceof klass);
}

function normalizeError(
  err: unknown,
  { codePrefix = "SERVER_FETCH", unknownMessage }: SafeServerFetchOptions,
): SafeResultError {
  if (err instanceof Error) {
    const status = statusFromError(err);
    const transport = transportFromError(err);
    return {
      code: status ? `${codePrefix}_${status}` : `${codePrefix}_FAILED`,
      message: err.message,
      ...(transport === undefined ? {} : { transport }),
    };
  }

  return {
    code: `${codePrefix}_UNKNOWN`,
    message: unknownMessage ?? "unknown server fetch error",
  };
}

function logServerFetchFailure(
  error: SafeResultError,
  opts: SafeServerFetchOptions,
): void {
  if (!opts.logPath) return;

  const statusMatch = error.code.match(/_(\d{3})$/);
  console.error("server_fetch_failed", {
    code: error.code,
    path: opts.logPath,
    status: statusMatch ? Number(statusMatch[1]) : null,
    ...((error as { readonly transport?: ApiTransportDescriptor }).transport ?? {}),
  });
}

export async function safeServerFetch<T>(
  thunk: () => Promise<T>,
  opts: SafeServerFetchOptions = {},
): Promise<SafeResult<T>> {
  try {
    return { ok: true, data: await thunk() };
  } catch (err) {
    if (shouldRethrow(err, opts.rethrowOn ?? [])) throw err;
    const error = normalizeError(err, opts);
    logServerFetchFailure(error, opts);
    return { ok: false, error };
  }
}
