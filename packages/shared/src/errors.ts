export type UbmErrorCode =
  | "UBM-1000"
  | "UBM-1001"
  | "UBM-1002"
  | "UBM-1404"
  | "UBM-4001"
  | "UBM-4002"
  | "UBM-4003"
  | "UBM-5000"
  | "UBM-5001"
  | "UBM-5101"
  | "UBM-5500"
  | "UBM-6001"
  | "UBM-6002"
  | "UBM-6003"
  | "UBM-6004";

export interface UbmErrorCodeMeta {
  status: number;
  title: string;
  defaultDetail: string;
}

export const UBM_ERROR_CODES = {
  "UBM-1000": { status: 400, title: "Bad Request", defaultDetail: "リクエストが不正です。" },
  "UBM-1001": { status: 422, title: "Validation Failed", defaultDetail: "入力値の検証に失敗しました。" },
  "UBM-1002": { status: 409, title: "Conflict", defaultDetail: "リソースの状態が競合しました。" },
  "UBM-1404": { status: 404, title: "Not Found", defaultDetail: "対象のリソースが見つかりません。" },
  "UBM-4001": { status: 401, title: "Unauthorized", defaultDetail: "認証が必要です。" },
  "UBM-4002": { status: 403, title: "Forbidden", defaultDetail: "この操作の権限がありません。" },
  "UBM-4003": { status: 403, title: "Tool Forbidden", defaultDetail: "このツールは利用できません。" },
  "UBM-5000": { status: 500, title: "Internal Server Error", defaultDetail: "内部エラーが発生しました。" },
  "UBM-5001": { status: 500, title: "Database Error", defaultDetail: "データベース操作に失敗しました。" },
  "UBM-5101": { status: 500, title: "Compensation Failed", defaultDetail: "補償処理に失敗しました。" },
  "UBM-5500": { status: 503, title: "Service Unavailable", defaultDetail: "一時的にサービスが利用できません。" },
  "UBM-6001": { status: 502, title: "External Service Error", defaultDetail: "外部サービスとの通信に失敗しました。" },
  "UBM-6002": { status: 504, title: "External Service Timeout", defaultDetail: "外部サービスへのリクエストがタイムアウトしました。" },
  "UBM-6003": { status: 503, title: "External Service Throttled", defaultDetail: "外部サービスのレート制限に達しました。" },
  "UBM-6004": { status: 502, title: "External Service Auth Error", defaultDetail: "外部サービスの認証に失敗しました。" },
} as const satisfies Record<UbmErrorCode, UbmErrorCodeMeta>;

const UBM_CODE_REGEX = /^UBM-[14-6]\d{3}$/;

export interface ApiErrorClientView {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: UbmErrorCode;
  traceId: string;
}

export interface ApiErrorLogExtra {
  stack?: string;
  sqlStatement?: string;
  externalResponseBody?: string;
  context?: Record<string, unknown>;
  cause?: unknown;
}

export interface ApiErrorOptions {
  code: UbmErrorCode;
  status?: number;
  title?: string;
  detail?: string;
  type?: string;
  instance?: string;
  traceId?: string;
  log?: ApiErrorLogExtra;
}

function generateUuidUrn(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `urn:uuid:${crypto.randomUUID()}`;
  }
  // Fallback (RFC 4122 v4 風、Workers 環境では crypto.randomUUID が常に利用可能)
  return `urn:uuid:${Math.random().toString(16).slice(2)}-fallback`;
}

export class ApiError extends Error {
  readonly code: UbmErrorCode;
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly type: string;
  readonly instance: string;
  readonly traceId: string;
  readonly log: ApiErrorLogExtra;

  constructor(options: ApiErrorOptions) {
    if (!UBM_CODE_REGEX.test(options.code)) {
      // 受け入れ不可な code（型を回避して渡された場合の防御）
      throw new Error(`Invalid UBM error code: ${options.code}`);
    }
    const meta = UBM_ERROR_CODES[options.code];
    const detail = options.detail ?? meta.defaultDetail;
    super(detail);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status ?? meta.status;
    this.title = options.title ?? meta.title;
    this.detail = detail;
    this.type = options.type ?? `urn:ubm:error:${options.code}`;
    this.instance = options.instance ?? generateUuidUrn();
    this.traceId = options.traceId ?? this.instance;
    this.log = options.log ?? {};
  }

  toClientJSON(): ApiErrorClientView {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      instance: this.instance,
      code: this.code,
      traceId: this.traceId,
    };
  }

  toLogJSON(): ApiErrorClientView & ApiErrorLogExtra {
    return {
      ...this.toClientJSON(),
      ...this.log,
    };
  }

  static fromUnknown(err: unknown, fallbackCode: UbmErrorCode = "UBM-5000"): ApiError {
    if (err instanceof ApiError) return err;
    if (err instanceof Error) {
      const log: ApiErrorLogExtra = {
        cause: err,
        context: { originalMessage: err.message, originalName: err.name },
      };
      if (err.stack !== undefined) log.stack = err.stack;
      return new ApiError({ code: fallbackCode, log });
    }
    if (typeof err === "string") {
      return new ApiError({
        code: fallbackCode,
        log: { context: { originalMessage: err } },
      });
    }
    return new ApiError({
      code: fallbackCode,
      log: { context: { original: safeStringify(err) } },
    });
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return "[unserializable]";
  }
}
