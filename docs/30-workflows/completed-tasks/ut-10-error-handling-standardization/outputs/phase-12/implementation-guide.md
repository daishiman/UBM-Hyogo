# 実装ガイド（Phase 12 Task 12-1 成果物）

## Part 1: 中学生レベル（例え話で理解する）

### エラーが起きたとき、どう知らせるか・どう対処するか

#### 例え話 1: お店で品切れの時の張り紙

お店で商品が売り切れたとき、店員さんは 2 種類の文章を書く。

- **お客さん向けの張り紙**: 「申し訳ございません、ただいま在庫がありません」
- **店長だけ見る発注ノート**: 「メーカー A から仕入れている◯◯◯。電話番号 03-xxxx-xxxx。月末に発注ミスがあった」

これと同じことを API もする。

- **クライアント（お客さん）に返すエラー**: 「内部エラーが発生しました。」のような短い説明だけ
- **サーバーログ（店長のノート）**: いつ・なぜ・どの SQL が失敗したか、詳細をすべて記録

仕入れ先の電話番号や原価（= データベースの接続文字列、認証トークン、スタックトレース）を **張り紙に書いてはいけない**。これが「機密情報非開示」。

UBM の API では `ApiError.toClientJSON()` が「張り紙の内容」だけを返し、`logError()` が「発注ノート」に詳細を残す仕組みになっている。

#### 例え話 2: 配達トラックが渋滞でつかまった

宅配便のトラックが渋滞で配達できなかったとき、すぐ「失敗です」と諦めない。**少し時間をおいてもう一度行ってみる**（リトライ）。

ただし、ずっと粘ると後ろの仕事が止まる。だから:
- 何回までやり直すか（`maxAttempts`）
- 間隔をどれくらい空けるか（`baseDelayMs`、指数バックオフ）
- 全部で何分まで粘るか（`totalTimeoutMs`）

を最初に決めておく。Cloudflare Workers では「1 リクエスト中に 2 回まで」「1 回の sleep は 200ms まで」と決まっている。これを `withRetry` 関数が自動で守る。

それ以上の粘りは「明日の便に積み直す」（= Cron で次回実行 or Cloudflare Queues）に任せる。これが「短時間 bounded retry + 長期 Cron 主戦略」。

#### 例え話 3: 銀行振込で送金途中に止まった

A さんから B さんに 1 万円送金するとき、

1. A さんの口座から 1 万円引く
2. B さんの口座に 1 万円足す

の 2 ステップがある。1 が成功して 2 が失敗したら、**1 を取り消さないと 1 万円が消える**。これが「補償処理（compensating transaction）」。

UBM の API では Cloudflare D1 がネスト TX をサポートしないため、`runWithCompensation` ヘルパが「成功したステップを逆順で取り消す」役割を果たす。万一補償も失敗したら（二重失敗）、「dead letter queue」という未処理ボックスに記録して人間が後で見る。

#### 例え話 4: 警察への 110 番通報

事件が起きたとき、110 番通報には必ず以下が記録される。

- 通報番号（識別 ID）
- 通報時刻
- 場所
- 内容のメモ
- 担当警察官

これが「構造化ログ」。UBM の API でも、エラーが起きるたびに必ず:
- `code`（エラー番号、例: `UBM-5001`）
- `traceId`（追跡 ID、UUID）
- `requestId`（リクエスト識別 ID）
- `timestamp`、`status`、`method`、`path`

を 1 行の JSON で記録する。あとで「いつ・何が・なぜ」失敗したか追える。

#### 覚えておくこと

エラーには「番号（コード）」「タイトル」「お客さん向け説明」「時刻」「リクエスト ID」を必ずつける。これがあると:
- お客さん（クライアント）はエラーコードを見て次に何すべきか判断できる
- 店長（開発者）はログを追跡して原因調査できる
- 機密情報（仕入れ先の電話番号）は外に漏れない

## Part 2: 技術者向け（API リファレンス）

### 2.1 ApiError 型定義

```ts
// packages/shared/src/errors.ts
export class ApiError extends Error {
  readonly code: UbmErrorCode;
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly type: string;       // urn:ubm:error:UBM-XXXX
  readonly instance: string;   // urn:uuid:...
  readonly traceId: string;    // = instance
  readonly log: ApiErrorLogExtra; // { stack, sqlStatement, externalResponseBody, cause, context }

  toClientJSON(): ApiErrorClientView; // ホワイトリスト 7 キー
  toLogJSON(): { ...toClientJSON, ...log }; // 全フィールド

  static fromUnknown(err: unknown, fallbackCode?: UbmErrorCode): ApiError;
}
```

### 2.2 UBM コード体系

| プレフィックス | 用途 | 例 |
| --- | --- | --- |
| UBM-1xxx | バリデーション / クライアント側問題 | UBM-1000, UBM-1001, UBM-1002, UBM-1404 |
| UBM-4xxx | 認証 / 認可 | UBM-4001, UBM-4002, UBM-4003 |
| UBM-5xxx | サーバー内部エラー | UBM-5000, UBM-5001, UBM-5101, UBM-5500 |
| UBM-6xxx | 外部依存（Sheets 等） | UBM-6001, UBM-6002, UBM-6003, UBM-6004 |

詳細: `apps/api/docs/error-handling.md` の §3。

### 2.3 withRetry シグネチャ

```ts
export interface RetryOptions {
  maxAttempts: number;        // Workers 上では <= 2 に強制 cap
  baseDelayMs: number;        // 指数バックオフの初期値
  totalTimeoutMs?: number;    // 超過時 UBM-6002
  classify?: (err: unknown) => "retry" | "stop";
  failureCode?: UbmErrorCode; // 上限到達時の throw コード（既定 UBM-5500）
  signal?: AbortSignal;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions,
): Promise<T>;

export const SHEETS_RETRY_PRESET: RetryOptions;
export function defaultClassify(err: unknown): "retry" | "stop";
```

### 2.4 補償処理 API

```ts
export interface CompensationStep<T = unknown> {
  name: string;
  execute: () => Promise<T>;
  compensate: () => Promise<unknown>;
}

export interface RunWithCompensationOptions {
  recordDeadLetter?: (info: {
    primaryError: unknown;
    compensationFailures: CompensationFailureRecord[];
    idempotencyKey?: string;
  }) => Promise<void>;
  idempotencyKey?: string;
  primaryFailureCode?: UbmErrorCode;       // default UBM-5001
  compensationFailureCode?: UbmErrorCode;  // default UBM-5101
}

export async function runWithCompensation<T>(
  steps: ReadonlyArray<CompensationStep>,
  options?: RunWithCompensationOptions,
): Promise<T[]>;
```

### 2.5 グローバルエラーハンドラ

```ts
// apps/api/src/middleware/error-handler.ts
export function errorHandler(err: Error, c: Context<any>): Response;
export function notFoundHandler(c: Context<any>): Response;

// apps/api/src/index.ts
app.notFound(notFoundHandler);
app.onError(errorHandler);
```

返却:
- `Content-Type: application/problem+json`
- ヘッダ: `x-request-id`, `x-trace-id`
- body: `ApiErrorClientView`（7 キー）+ 開発環境のみ `debug` フィールド

### 2.6 構造化ログ

```ts
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface StructuredLogPayload {
  timestamp: string;
  level: LogLevel;
  code: string;
  status?: number;
  message: string;
  traceId?: string;
  instance?: string;
  requestId?: string;
  method?: string;
  path?: string;
  env?: string;
  context?: Record<string, unknown>;
  log?: { stack?, sqlStatement?, externalResponseBody?, cause? };
  [key: string]: unknown;
}

export function logError(input: StructuredLogInput): void;
export function logWarn(input: StructuredLogInput): void;
export function logInfo(input: StructuredLogInput): void;
export function logDebug(input: StructuredLogInput): void;

export function sanitize<T>(value: T): T;
```

サニタイズ:
- `SENSITIVE_KEY_SUBSTRINGS` 11 件 → `[REDACTED]`
- 文字列 > 200 文字 → `...[truncated:N chars]`
- 循環参照 → `[Circular]`
- Error → `{ name, message, stackPreview: 先頭5行 }`

### 2.7 設定値一覧

| 設定 | 値 | 由来 |
| --- | --- | --- |
| `WORKERS_MAX_ATTEMPTS_CAP` | 2 | retry.ts 内部定数（Workers 制約） |
| `DEFAULT_MAX_DELAY_PER_SLEEP_MS` | 200 | 同（CPU 制限回避） |
| `SHEETS_RETRY_PRESET.maxAttempts` | 2 | retry.ts |
| `SHEETS_RETRY_PRESET.baseDelayMs` | 100 | retry.ts |
| `SHEETS_RETRY_PRESET.totalTimeoutMs` | 800 | retry.ts |
| `SHEETS_RETRY_PRESET.failureCode` | "UBM-6001" | retry.ts |
| `SENSITIVE_KEY_SUBSTRINGS` | 11 件 | logging.ts |

### 2.8 利用例

`apps/api/docs/error-handling.md` §11 参照（Sheets API → D1 同期のミニマルサンプル）。

## まとめ

| 観点 | 担当モジュール | 公開 API |
| --- | --- | --- |
| エラー型 | `@ubm-hyogo/shared/errors` | `ApiError`, `UBM_ERROR_CODES`, `UbmErrorCode`, `ApiErrorClientView` |
| リトライ | `@ubm-hyogo/shared/retry` | `withRetry`, `SHEETS_RETRY_PRESET`, `defaultClassify` |
| 補償処理 | `@ubm-hyogo/shared/db/transaction` | `runWithCompensation`, `CompensationStep` |
| ログ | `@ubm-hyogo/shared/logging` | `logError`, `logWarn`, `logInfo`, `logDebug`, `sanitize` |
| 統合 | `apps/api/src/middleware/error-handler.ts` | `errorHandler`, `notFoundHandler` |
| クライアント | `apps/web/app/lib/api-client.ts` | `parseApiResponse`, `isApiErrorClientView` |
