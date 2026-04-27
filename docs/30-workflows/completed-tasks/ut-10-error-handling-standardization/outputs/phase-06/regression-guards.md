# 回帰 guard テスト設計（Phase 6 成果物）

## guard 対象（6 ケース）

| # | 対象 | guard | guard 目的 |
| --- | --- | --- | --- |
| 2.1 | `ApiError.toClientJSON()` | スナップショット: `{ type, title, status, detail, instance, code, traceId }` 7 キーちょうど | RFC 7807 + UBM 拡張の欠落 / 余剰検出 |
| 2.2 | `UBM_ERROR_CODES` 定数値 | スナップショット: 15 コードの `status`/`title`/`defaultDetail` | 既存クライアントとの後方互換破壊検出 |
| 2.3 | `errorHandler` Response | `Content-Type: application/problem+json` 固定 | RFC 7807 ヘッダ仕様回帰検出 |
| 2.4 | `errorHandler` Response/Log | `body.instance === log.instance === log.traceId` | トレース ID 整合の回帰 |
| 2.5 | `apps/web` `parseApiResponse` | 受信 JSON を `ApiClientResult<T>` 型として返す契約 | クライアント整合の回帰 |
| 2.6 | `SHEETS_RETRY_PRESET` | スナップショット: `maxAttempts: 2`, `baseDelayMs: 100`, `totalTimeoutMs: 800`, `failureCode: "UBM-6001"` | 設計値の意図せぬ変更検出 |

## スナップショット 1: `UBM_ERROR_CODES` 不変表

```ts
// errors.ts に定義された定数の期待スナップショット
{
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
}
```

## スナップショット 2: クライアント返却 view キー集合

```
type, title, status, detail, instance, code, traceId
```

（`stack` / `sqlStatement` / `externalResponseBody` / `cause` / `context` を含めないこと）

## スナップショット 3: `SHEETS_RETRY_PRESET`

```ts
{
  maxAttempts: 2,
  baseDelayMs: 100,
  totalTimeoutMs: 800,
  classify: defaultClassify,
  failureCode: "UBM-6001",
}
```

## guard 実装方針

vitest 導入時には `expect(value).toMatchInlineSnapshot()` を採用し、本ドキュメントのスナップショットを inline で固定する。

現状は型レベル + 定数値レベルで以下を保証:

- `UbmErrorCode` 型ユニオンが 15 件ぴったり（追加時は型エラー）
- `UBM_ERROR_CODES` の `as const satisfies Record<UbmErrorCode, UbmErrorCodeMeta>` により、コードと表の対応を強制
- `SHEETS_RETRY_PRESET` の `as const satisfies RetryOptions` により、必須フィールドの欠落検出

## 既存テスト本数

Phase 5 完了時点: 0（vitest 未導入）
Phase 6 完了後: 0（同上）
回帰: 検出可能領域では発生していない（typecheck PASS で判定）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | guard 6 件をカバレッジ baseline とする |
| Phase 9 | 品質保証で typecheck/lint と本ガード設計の整合を最終確認 |
