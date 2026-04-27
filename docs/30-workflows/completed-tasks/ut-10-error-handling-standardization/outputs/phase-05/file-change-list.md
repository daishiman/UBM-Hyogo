# 変更ファイル一覧（Phase 5 成果物）

## 概要

`git status --short -- apps/api/src apps/web packages/shared` の出力（UT-10 スコープ内）:

```
M apps/api/src/index.ts
 M packages/shared/package.json
 M packages/shared/src/index.ts
?? apps/api/src/middleware/
?? apps/web/app/lib/
?? packages/shared/src/db/
?? packages/shared/src/errors.ts
?? packages/shared/src/logging.ts
?? packages/shared/src/retry.ts
```

## 新規ファイル

| # | パス | LOC（概算）| 役割 |
| --- | --- | --- | --- |
| 1 | `packages/shared/src/errors.ts` | ~140 | `ApiError` クラス、`UbmErrorCode` / `UBM_ERROR_CODES`、`isApiError`、`fromUnknown` |
| 2 | `packages/shared/src/retry.ts` | ~110 | `withRetry`、`defaultClassify`、`SHEETS_RETRY_PRESET`、Workers 制約丸め込み |
| 3 | `packages/shared/src/db/transaction.ts` | ~80 | `runWithCompensation`、`CompensationStep`、二重失敗時 UBM-5101 |
| 4 | `packages/shared/src/logging.ts` | ~100 | `logError`/`logWarn`/`logInfo`/`logDebug`、`sanitize`（substring REDACT + truncate + 循環参照対応） |
| 5 | `apps/api/src/middleware/error-handler.ts` | ~95 | Hono `onError` 用 `errorHandler` + `notFoundHandler`、開発環境 debug 付与 |
| 6 | `apps/web/app/lib/api-client.ts` | ~60 | クライアント型整合: `parseApiResponse`、`isApiErrorClientView`、`isProblemJson` |

## 修正ファイル

| # | パス | 変更内容 |
| --- | --- | --- |
| 1 | `packages/shared/src/index.ts` | `ApiError`/`UBM_ERROR_CODES`/`UbmErrorCode`/`withRetry`/`runWithCompensation`/`logError` 等を re-export |
| 2 | `packages/shared/package.json` | `exports` に `./errors`, `./retry`, `./db/transaction`, `./logging` の subpath を追加 |
| 3 | `apps/api/src/index.ts` | `app.notFound(notFoundHandler)` と `app.onError(errorHandler)` を Hono 初期化直後に登録 |

## スコープ外（参考）

worktree 直下の `docs/01-infrastructure-setup/` 配下に大量の `D` (deleted) が見えるが、これらは本ブランチ作成時点の状態で、本タスクの変更ではない（merge base 由来）。本タスクの変更は上記 9 件のみ。

## 影響範囲

| 領域 | 影響 |
| --- | --- |
| 既存 API ルート（`/`, `/health`, `/sync/*`）| 変更なし、`onError` 経由で統一エラー化のみ |
| `runSync` / `runBackfill` の戻り値 | 変更なし（業務ロジックは UT-09 で再構成予定） |
| Cron Trigger | 変更なし |
| `apps/web` の既存ページ | 変更なし（`api-client.ts` は新規・他ページから未参照）|

## 後方互換性

- `apps/api/src/sync/worker.ts` は `try/catch` で `errorReason` を文字列化して返す現行実装を維持
- 将来 UT-09 で `withRetry` / `runWithCompensation` に置き換える際は別タスクで実施
- 既存の Hono ルートはエラーをスローしない限り従来通り動作（onError は throw 時のみトリガー）
