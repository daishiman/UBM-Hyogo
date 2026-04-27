# `ApiError` 型 / RFC 7807 ベース構造（Phase 2 成果物）

## 1. 設計方針

- **基盤**: RFC 7807 Problem Details for HTTP APIs
- **拡張**: UBM 固有 `code` / `traceId` を独自フィールドとして追加（標準フィールドは上書きしない）
- **2 ビュー分離**: クライアント返却用（safe view）と内部ログ用（full view）を区別
- **Error 継承**: JS の `instanceof Error` で動作するように `Error` 派生クラスとして実装
- **zod スキーマ整合**: 将来 zod runtime validation を導入する場合に共通化できる構造

## 2. TypeScript 型定義

```ts
// packages/shared/src/errors.ts

/** UBM エラーコード文字列リテラル型 */
export type UbmErrorCode =
  | "UBM-1000" | "UBM-1001" | "UBM-1002" | "UBM-1404"
  | "UBM-4001" | "UBM-4002" | "UBM-4003"
  | "UBM-5000" | "UBM-5001" | "UBM-5101" | "UBM-5500"
  | "UBM-6001" | "UBM-6002" | "UBM-6003" | "UBM-6004";

/** クライアント返却用フィールド（ホワイトリスト） */
export interface ApiErrorClientView {
  /** RFC 7807 type URI（既定は `urn:ubm:error:<code>`） */
  type: string;
  /** RFC 7807 title（人間可読の短い概要） */
  title: string;
  /** HTTP status code */
  status: number;
  /** RFC 7807 detail（人間可読の詳細、機密情報を含めない） */
  detail: string;
  /** RFC 7807 instance（このエラー固有の URI、未指定時は urn:uuid:* で自動採番） */
  instance: string;
  /** UBM 拡張: 機械可読コード */
  code: UbmErrorCode;
  /** UBM 拡張: トレース ID（ログとの相関用） */
  traceId: string;
}

/** ログ専用拡張（クライアントには返さない） */
export interface ApiErrorLogExtra {
  /** 元例外の stack trace */
  stack?: string;
  /** SQL 文（D1 関連エラー時のみ） */
  sqlStatement?: string;
  /** 外部 API レスポンス本文（Sheets エラー時のみ） */
  externalResponseBody?: string;
  /** 任意コンテキスト（既にサニタイズ済みであることを呼び出し側が保証） */
  context?: Record<string, unknown>;
  /** cause チェーン（オリジナルの error） */
  cause?: unknown;
}

/** ApiError 構築オプション */
export interface ApiErrorOptions {
  code: UbmErrorCode;
  status?: number;       // 省略時はコード→ステータス表から自動決定
  title?: string;        // 省略時はコード→title 表から自動決定
  detail?: string;       // 省略時はコード→defaultDetail 表から自動決定
  type?: string;         // 省略時は `urn:ubm:error:<code>`
  instance?: string;     // 省略時は `urn:uuid:<crypto.randomUUID()>`
  traceId?: string;      // 省略時は instance と同一値で初期化
  log?: ApiErrorLogExtra; // ログ用追加情報
}

/** ApiError クラス（Error 派生） */
export class ApiError extends Error {
  readonly code: UbmErrorCode;
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly type: string;
  readonly instance: string;
  readonly traceId: string;
  readonly log: ApiErrorLogExtra;

  constructor(options: ApiErrorOptions);

  /** クライアント返却用 JSON（ホワイトリスト適用済み） */
  toClientJSON(): ApiErrorClientView;

  /** ログ出力用 JSON（context 等を含む。サニタイズは呼び出し側 or logging layer で実施） */
  toLogJSON(): ApiErrorClientView & ApiErrorLogExtra;

  /** 任意の値（unknown）を ApiError に正規化。既知 ApiError はそのまま返す */
  static fromUnknown(err: unknown, fallbackCode?: UbmErrorCode): ApiError;
}

/** type guard */
export function isApiError(value: unknown): value is ApiError;
```

## 3. 標準コード→属性マッピング表（実装内部定数）

```ts
export const UBM_ERROR_CODES = {
  "UBM-1000": { status: 400, title: "Bad Request",            defaultDetail: "リクエストが不正です。" },
  "UBM-1001": { status: 422, title: "Validation Failed",      defaultDetail: "入力値の検証に失敗しました。" },
  "UBM-1002": { status: 409, title: "Conflict",               defaultDetail: "リソースの状態が競合しました。" },
  "UBM-1404": { status: 404, title: "Not Found",              defaultDetail: "対象のリソースが見つかりません。" },
  "UBM-4001": { status: 401, title: "Unauthorized",           defaultDetail: "認証が必要です。" },
  "UBM-4002": { status: 403, title: "Forbidden",              defaultDetail: "この操作の権限がありません。" },
  "UBM-4003": { status: 403, title: "Tool Forbidden",         defaultDetail: "このツールは利用できません。" },
  "UBM-5000": { status: 500, title: "Internal Server Error",  defaultDetail: "内部エラーが発生しました。" },
  "UBM-5001": { status: 500, title: "Database Error",         defaultDetail: "データベース操作に失敗しました。" },
  "UBM-5101": { status: 500, title: "Compensation Failed",    defaultDetail: "補償処理に失敗しました。" },
  "UBM-5500": { status: 503, title: "Service Unavailable",    defaultDetail: "一時的にサービスが利用できません。" },
  "UBM-6001": { status: 502, title: "External Service Error", defaultDetail: "外部サービスとの通信に失敗しました。" },
  "UBM-6002": { status: 504, title: "External Service Timeout", defaultDetail: "外部サービスへのリクエストがタイムアウトしました。" },
  "UBM-6003": { status: 503, title: "External Service Throttled", defaultDetail: "外部サービスのレート制限に達しました。" },
  "UBM-6004": { status: 502, title: "External Service Auth Error", defaultDetail: "外部サービスの認証に失敗しました。" },
} as const satisfies Record<UbmErrorCode, { status: number; title: string; defaultDetail: string }>;
```

## 4. レスポンスサンプル

### 通常エラー（クライアント返却）

```http
HTTP/1.1 502 Bad Gateway
Content-Type: application/problem+json

{
  "type": "urn:ubm:error:UBM-6001",
  "title": "External Service Error",
  "status": 502,
  "detail": "Google Sheets API への問い合わせに失敗しました。しばらく経ってから再度お試しください。",
  "instance": "urn:uuid:8b7f2d2e-3a3a-4d52-9b1f-12cba1cd9012",
  "code": "UBM-6001",
  "traceId": "urn:uuid:8b7f2d2e-3a3a-4d52-9b1f-12cba1cd9012"
}
```

### 開発環境のみ（debug フィールド付き）

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/problem+json

{
  "type": "urn:ubm:error:UBM-5000",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "内部エラーが発生しました。",
  "instance": "urn:uuid:...",
  "code": "UBM-5000",
  "traceId": "urn:uuid:...",
  "debug": {
    "originalMessage": "Cannot read property 'foo' of undefined",
    "stackPreview": "TypeError: Cannot read property...\n    at ..."
  }
}
```

## 5. zod 整合方針

`zod` は MVP 段階で未導入。将来導入時には:

```ts
import { z } from "zod";
export const apiErrorClientViewSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string(),
  code: z.string().regex(/^UBM-[14-6]\d{3}$/),
  traceId: z.string(),
});
```

を `apps/web` 側で利用予定。今回の `ApiError` 型は zod スキーマ展開時に 1:1 で対応するキー集合になっている。

## 6. 不変条件

| # | 不変条件 |
| --- | --- |
| INV-1 | `ApiError` インスタンスは `instanceof Error === true` |
| INV-2 | `code` は `UBM-Nxxx` 形式（regex `^UBM-[14-6]\d{3}$`）に一致する |
| INV-3 | `instance` と `traceId` は省略時に `urn:uuid:` プレフィックス付きで自動採番される |
| INV-4 | `toClientJSON()` の戻り値に `stack` / `sqlStatement` / `externalResponseBody` / `cause` / `context` が含まれない |
| INV-5 | コード→ステータスマッピングは `UBM_ERROR_CODES` 表に集約される（散在しない）|

## 7. 配置先

| ファイル | 内容 |
| --- | --- |
| `packages/shared/src/errors.ts` | `ApiError` クラス + `UbmErrorCode` + `UBM_ERROR_CODES` + `isApiError` |
| `packages/shared/src/index.ts` | barrel re-export |
