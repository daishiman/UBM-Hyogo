import type { Context } from "hono";
import {
  ApiError,
  isApiError,
  type ApiErrorClientView,
} from "@ubm-hyogo/shared/errors";
import { logError, type StructuredLogInput } from "@ubm-hyogo/shared/logging";

// Bindings は呼び出し側で型付けされる（apps/api の Env を Hono ジェネリクス経由で受ける）。
// 本ハンドラ内では `ENVIRONMENT` のみを optional に参照する。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyContext = Context<any>;

type DebugView = { debug?: { originalMessage: string; stackPreview?: string } };

function buildResponse(
  c: AnyContext,
  apiError: ApiError,
  requestId: string,
): Response {
  const clientView: ApiErrorClientView & DebugView = apiError.toClientJSON();
  if (c.env?.ENVIRONMENT === "development") {
    const stackPreview = apiError.log.stack?.split("\n").slice(0, 5).join("\n");
    const originalMessage = apiError.log.cause instanceof Error
      ? apiError.log.cause.message
      : apiError.message;
    const debug: { originalMessage: string; stackPreview?: string } = { originalMessage };
    if (stackPreview !== undefined) debug.stackPreview = stackPreview;
    clientView.debug = debug;
  }
  return new Response(JSON.stringify(clientView), {
    status: apiError.status,
    headers: {
      "Content-Type": "application/problem+json",
      "x-request-id": requestId,
      "x-trace-id": apiError.traceId,
    },
  });
}

export function errorHandler(
  err: Error,
  c: AnyContext,
): Response {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  const apiError = isApiError(err) ? err : ApiError.fromUnknown(err, "UBM-5000");

  let path: string;
  try {
    path = new URL(c.req.url).pathname;
  } catch {
    path = c.req.url;
  }

  const log: StructuredLogInput["log"] = {};
  if (apiError.log.stack !== undefined) log.stack = apiError.log.stack;
  if (apiError.log.sqlStatement !== undefined) log.sqlStatement = apiError.log.sqlStatement;
  if (apiError.log.externalResponseBody !== undefined) {
    log.externalResponseBody = apiError.log.externalResponseBody;
  }
  if (apiError.log.cause !== undefined) {
    log.cause = apiError.log.cause instanceof Error
      ? { name: apiError.log.cause.name, message: apiError.log.cause.message }
      : apiError.log.cause;
  }

  const payload: StructuredLogInput = {
    code: apiError.code,
    status: apiError.status,
    message: apiError.message,
    traceId: apiError.traceId,
    instance: apiError.instance,
    requestId,
    method: c.req.method,
    path,
    log,
  };
  if (c.env?.ENVIRONMENT) payload.env = c.env.ENVIRONMENT;
  if (apiError.log.context !== undefined) payload.context = apiError.log.context;

  logError(payload);

  return buildResponse(c, apiError, requestId);
}

export function notFoundHandler(c: AnyContext): Response {
  let path: string;
  try {
    path = new URL(c.req.url).pathname;
  } catch {
    path = c.req.url;
  }
  const err = new ApiError({
    code: "UBM-1404",
    detail: `Route ${c.req.method} ${path} は存在しません。`,
  });
  return errorHandler(err, c);
}
