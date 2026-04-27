# API インターフェース契約

## UT-10 グローバルエラーハンドラ

`apps/api` は Hono runtime 上で `errorHandler` と `notFoundHandler` を登録し、API エラー応答を `application/problem+json` に統一する。

```ts
export function errorHandler(err: Error, c: Context<any>): Response;
export function notFoundHandler(c: Context<any>): Response;

app.notFound(notFoundHandler);
app.onError(errorHandler);
```

### 返却契約

- `Content-Type` は `application/problem+json`
- `x-request-id` は incoming `x-request-id` を echo し、なければ UUID を生成する
- `x-trace-id` は `ApiError.traceId`
- body は `ApiErrorClientView` の 7 フィールドのみ
- `ENVIRONMENT === "development"` の場合だけ `debug.originalMessage` と `debug.stackPreview` を追加できる
- production / staging では stack、SQL、外部レスポンス本文、cause、任意 context を body に含めてはならない

### 例外正規化

- `ApiError` はそのまま返却契約へ変換する
- その他の `Error` / `string` / `unknown` は `ApiError.fromUnknown(err, "UBM-5000")` で未知内部エラーへ正規化する
- 404 は `notFoundHandler` が `UBM-1404` として扱う

### ログ契約

`errorHandler` は `logError()` に以下を渡す。

- `code`
- `status`
- `message`
- `traceId`
- `instance`
- `requestId`
- `method`
- `path`
- `env`（存在する場合）
- `context`（存在する場合）
- `log.stack` / `log.sqlStatement` / `log.externalResponseBody` / `log.cause`（存在する場合）

ログ出力前に `@ubm-hyogo/shared/logging` の `sanitize()` が機密キーを redact する。

## Web クライアント同期契約

`apps/web/app/lib/api-client.ts` は `ApiErrorClientView` と `UbmErrorCode` を `@ubm-hyogo/shared/errors` から type import する。

```ts
export type ApiClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorClientView };

export function isApiErrorClientView(value: unknown): value is ApiErrorClientView;
export function parseApiResponse<T>(res: Response): Promise<ApiClientResult<T>>;
```

`application/problem+json` かつ body が `ApiErrorClientView` の場合はそのまま返し、不正形式または非 problem JSON の失敗は client-generated `UBM-5000` に正規化する。

## 関連

- `references/error-handling.md`
- `references/interfaces-shared.md`
- `apps/api/docs/error-handling.md`
- `docs/30-workflows/ut-10-error-handling-standardization/`
