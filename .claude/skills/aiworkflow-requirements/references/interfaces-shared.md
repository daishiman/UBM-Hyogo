# @ubm-hyogo/shared 公開インターフェース

## UT-10 エラーハンドリング標準

UT-10 で `@ubm-hyogo/shared` は API / Web / 後続同期ジョブで共通利用するエラー処理契約を公開する。

### `@ubm-hyogo/shared/errors`

```ts
export type UbmErrorCode =
  | "UBM-1000" | "UBM-1001" | "UBM-1002" | "UBM-1404"
  | "UBM-4001" | "UBM-4002" | "UBM-4003"
  | "UBM-5000" | "UBM-5001" | "UBM-5101" | "UBM-5500"
  | "UBM-6001" | "UBM-6002" | "UBM-6003" | "UBM-6004";

export interface ApiErrorClientView {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: UbmErrorCode;
  traceId: string;
}

export class ApiError extends Error {
  toClientJSON(): ApiErrorClientView;
  toLogJSON(): ApiErrorClientView & ApiErrorLogExtra;
  static fromUnknown(err: unknown, fallbackCode?: UbmErrorCode): ApiError;
}
```

`toClientJSON()` はクライアント返却ホワイトリストであり、`stack` / `cause` / `sqlStatement` / `externalResponseBody` / 任意 `context` を含めてはならない。

### `@ubm-hyogo/shared/retry`

```ts
export type RetryClassification = "retry" | "stop";

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  totalTimeoutMs?: number;
  classify: (err: unknown) => RetryClassification;
  signal?: AbortSignal;
  isWorkersRuntime?: boolean;
  failureCode?: UbmErrorCode;
  maxDelayPerSleepMs?: number;
}

export function defaultClassify(err: unknown): RetryClassification;
export const SHEETS_RETRY_PRESET: RetryOptions;
export function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
): Promise<T>;
```

Workers runtime では `maxAttempts` は 2 回に cap し、1 sleep は 200ms を上限とする。長期再試行は UT-09 の Cron / Queues 実装に委譲する。

### `@ubm-hyogo/shared/db/transaction`

```ts
export interface CompensationStep<TResult = unknown> {
  name: string;
  execute: () => Promise<TResult>;
  compensate: (result: TResult) => Promise<void>;
}

export interface CompensationFailureRecord {
  failedStep: string;
  compensationFailures: Array<{ step: string; reason: unknown }>;
  originalCause: unknown;
}

export interface RunWithCompensationOptions {
  compensationFailureCode?: UbmErrorCode;
  primaryFailureCode?: UbmErrorCode;
  recordDeadLetter?: (failure: CompensationFailureRecord) => Promise<void>;
}

export function runWithCompensation<T = unknown>(
  steps: ReadonlyArray<CompensationStep>,
  options?: RunWithCompensationOptions,
): Promise<T[]>;
```

成功済み step は失敗時に逆順で `compensate(result)` を呼ぶ。補償成功時は primary failure、補償失敗時は compensation failure として `ApiError` に正規化する。

### `@ubm-hyogo/shared/logging`

```ts
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
  log?: Record<string, unknown>;
  instance?: string;
}

export function sanitize<T>(value: T): T;
export function logError(payload: StructuredLogInput): void;
export function logWarn(payload: StructuredLogInput): void;
export function logInfo(payload: StructuredLogInput): void;
export function logDebug(payload: StructuredLogInput): void;
```

`sanitize()` は sensitive key redact、長大文字列 truncate、循環参照 `[Circular]` 化、`Error` の preview 化を行う。値内 secret の高度な検出は UT-08 のログ集約側で追加検討する。

## 関連

- `references/error-handling.md`
- `references/interfaces-api.md`
- `apps/api/docs/error-handling.md`
- `docs/30-workflows/ut-10-error-handling-standardization/`
