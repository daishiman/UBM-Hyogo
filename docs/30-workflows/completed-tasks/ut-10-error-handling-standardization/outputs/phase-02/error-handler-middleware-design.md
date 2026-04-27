# `errorHandler` ミドルウェア設計（Phase 2 成果物）

## 1. 設計方針

- Hono の `app.onError((err, c) => Response)` を起点に統一処理する
- 既知 `ApiError` はそのまま整形、未知例外は `UBM-5000` (internal_unknown) に正規化
- レスポンスは RFC 7807 (`application/problem+json`) で返却
- 内部詳細（stack trace / SQL / 外部 API レスポンス本文）はログのみ、レスポンスから自動 strip
- `traceId`（= `instance`）を生成・伝播し、ログとレスポンスで関連付け可能にする
- 開発環境（`ENVIRONMENT === "development"`）のみ `debug` フィールドを許可

## 2. 処理フロー（Mermaid）

```mermaid
flowchart TD
  A[Request 受信] --> B[ハンドラ実行]
  B -->|正常| C[Response 返却]
  B -->|throw| D{ApiError か?}
  D -->|Yes 既知| E[ApiError をそのまま採用]
  D -->|No 未知| F[ApiError.fromUnknown(err) で正規化<br/>fallback: UBM-5000]
  E --> G[traceId 生成/伝播<br/>instance を一意化]
  F --> G
  G --> H[構造化ログ出力<br/>logError(toLogJSON())]
  H --> I[サニタイズ + ホワイトリスト適用]
  I --> J{ENVIRONMENT?}
  J -->|development| K[debug フィールド付与]
  J -->|staging/production| L[strip すべての内部詳細]
  K --> M[Response 組み立て<br/>application/problem+json + status]
  L --> M
  M --> N[クライアント返却]
```

## 3. 実装スケルトン

```ts
// apps/api/src/middleware/error-handler.ts
import type { ErrorHandler } from "hono";
import {
  ApiError,
  isApiError,
  type ApiErrorClientView,
} from "@ubm-hyogo/shared";
import { logError } from "@ubm-hyogo/shared";

interface ErrorHandlerEnv {
  ENVIRONMENT: "production" | "staging" | "development";
}

export const errorHandler: ErrorHandler<{ Bindings: ErrorHandlerEnv }> = (
  err,
  c,
) => {
  const requestId =
    c.req.header("x-request-id") ?? crypto.randomUUID();

  const apiError = isApiError(err)
    ? err
    : ApiError.fromUnknown(err, "UBM-5000");

  // ログ出力（traceId / requestId 相関）
  logError({
    code: apiError.code,
    status: apiError.status,
    message: apiError.message,
    traceId: apiError.traceId,
    requestId,
    instance: apiError.instance,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    log: apiError.log,        // logging layer 内で sanitize
  });

  const clientView: ApiErrorClientView & { debug?: object } =
    apiError.toClientJSON();

  if (c.env.ENVIRONMENT === "development") {
    clientView.debug = {
      originalMessage: apiError.message,
      stackPreview: apiError.log.stack?.split("\n").slice(0, 5).join("\n"),
    };
  }

  return c.json(clientView, apiError.status as 400, {
    "Content-Type": "application/problem+json",
    "x-request-id": requestId,
  });
};
```

## 4. 既知例外分岐ルール

| 入力 `err` | 処理 |
| --- | --- |
| `instanceof ApiError` | そのまま採用 |
| `instanceof Error` | `ApiError.fromUnknown(err)` で `UBM-5000` に正規化、`message` を `log.cause` として保持、`stack` を `log.stack` に保存 |
| string | `ApiError.fromUnknown(err)`、`detail` は固定の defaultDetail（漏洩防止）|
| `unknown`（その他） | `ApiError.fromUnknown(err)`、`log.context.original = String(err)` |
| `HTTPException`（Hono 標準）| `ApiError` にマッピング（status を尊重し、code は status に応じて UBM-1xxx / 5xxx を選択）|

## 5. 404 / not found との連携

```ts
// apps/api/src/index.ts
app.notFound((c) => {
  const err = new ApiError({
    code: "UBM-1404",
    detail: `Route ${c.req.method} ${new URL(c.req.url).pathname} は存在しません。`,
  });
  return errorHandler(err, c);
});
app.onError(errorHandler);
```

## 6. レスポンス組み立てルール

- Content-Type は固定 `application/problem+json`
- HTTP status は `apiError.status`（コード→ステータス表に従う）
- ボディは `toClientJSON()` の戻り値（INV-4 によりホワイトリスト適用済み）
- 開発環境のみ `debug` を後付け（クライアント view を mutate せず spread で別オブジェクト化）

## 7. 不変条件

| # | 不変条件 |
| --- | --- |
| INV-M1 | `errorHandler` から返るレスポンスは常に `application/problem+json` |
| INV-M2 | レスポンスボディには `code` / `title` / `status` / `detail` / `instance` / `type` / `traceId` のみ（+ dev のみ `debug`）|
| INV-M3 | `console.error` は構造化ログ 1 行のみで `stack` / `sqlStatement` / `externalResponseBody` を含めることは logging layer のサニタイズを通過した結果のみ |
| INV-M4 | 同一リクエストで `traceId` と `instance` と response header `x-request-id` が紐付けられる |

## 8. 配線箇所

```ts
// apps/api/src/index.ts（修正箇所抜粋）
import { errorHandler } from "./middleware/error-handler";
import { ApiError } from "@ubm-hyogo/shared";

const app = new Hono<{ Bindings: Env }>();

// 既存ルート定義...

app.notFound((c) => errorHandler(
  new ApiError({ code: "UBM-1404", detail: `Route ${c.req.method} ${new URL(c.req.url).pathname} は存在しません。` }),
  c,
));
app.onError(errorHandler);
```
