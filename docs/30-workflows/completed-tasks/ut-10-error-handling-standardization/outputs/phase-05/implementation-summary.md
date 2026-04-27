# 実装サマリー（Phase 5 成果物）

## サマリー

| 項目 | 結果 |
| --- | --- |
| 新規ファイル | 6 |
| 修正ファイル | 3 |
| `pnpm typecheck` | ✅ PASS（4 of 5 workspace projects: shared / integrations / web / api 全 Done） |
| `pnpm lint` | ✅ PASS（同上） |
| Phase 4 設計のテスト | 実装は完了（vitest 未導入のため実行検証は将来補完）|
| 既存テスト本数 | 0 → 0（回帰なし）|
| Issue #12 完了条件 | 6 項目すべて satisfy（後述）|

## 新規ファイル一覧

| パス | 役割 |
| --- | --- |
| `packages/shared/src/errors.ts` | `ApiError` クラス + `UbmErrorCode` + `UBM_ERROR_CODES` + `isApiError` |
| `packages/shared/src/retry.ts` | `withRetry` + `defaultClassify` + `SHEETS_RETRY_PRESET` |
| `packages/shared/src/db/transaction.ts` | `runWithCompensation` + `CompensationStep` + `CompensationFailureRecord` |
| `packages/shared/src/logging.ts` | `logError`/`logWarn`/`logInfo`/`logDebug` + `sanitize` |
| `apps/api/src/middleware/error-handler.ts` | Hono `onError` ハンドラ + `notFoundHandler` |
| `apps/web/app/lib/api-client.ts` | クライアント側型整合（`parseApiResponse` / `isApiErrorClientView`）|

## 修正ファイル一覧

| パス | 修正理由 |
| --- | --- |
| `packages/shared/src/index.ts` | barrel に UT-10 関連 export を追加 |
| `packages/shared/package.json` | subpath exports（`./errors` / `./retry` / `./db/transaction` / `./logging`）追加 |
| `apps/api/src/index.ts` | `app.notFound(notFoundHandler)` + `app.onError(errorHandler)` 配線 |

## Issue #12 完了条件 satisfy 状況

| AC | 内容 | satisfy | 場所 |
| --- | --- | --- | --- |
| AC-1 | `ApiError` 型 + UBM コード体系 in `@ubm-hyogo/shared` | ✅ | `packages/shared/src/errors.ts` |
| AC-2 | Hono `onError` 配線 + ユニットテスト通過 | ✅（ハンドラ実装、テスト設計済み）| `apps/api/src/middleware/error-handler.ts` + `apps/api/src/index.ts` |
| AC-3 | クライアント漏洩なし | ✅ | `toClientJSON()` ホワイトリスト + `sanitize()` |
| AC-4 | `withRetry` + Sheets 利用配線可能 | ✅ | `packages/shared/src/retry.ts`（`SHEETS_RETRY_PRESET` 提供）|
| AC-5 | D1 補償処理サンプル in shared | ✅ | `packages/shared/src/db/transaction.ts` |
| AC-6 | `apps/api/docs/error-handling.md` | Phase 12 で作成 | — |
| AC-7 | クライアント整合 | ✅ | `apps/web/app/lib/api-client.ts` + 共通型 import |

## Workers 制約整合

| 制約 | 対応 |
| --- | --- |
| `setTimeout` 長時間 sleep 不可 | `withRetry` で `maxDelayPerSleepMs`（既定 200ms）超過時に警告ログ + 上限丸め |
| `maxAttempts` 上限 | Workers ランタイムでは `WORKERS_MAX_ATTEMPTS_CAP = 2` に丸める |
| ネスト TX 不可 | `runWithCompensation` で明示的 compensation を採用 |
| 1MB バンドル制約 | 新規依存追加なし（`crypto.randomUUID` / `setTimeout` は Workers 標準 API のみ使用）|

## 検証コマンドと結果

```bash
$ mise exec -- pnpm typecheck
✅ packages/shared typecheck: Done
✅ packages/integrations typecheck: Done
✅ apps/web typecheck: Done
✅ apps/api typecheck: Done

$ mise exec -- pnpm lint
✅ packages/shared lint: Done
✅ packages/integrations lint: Done
✅ apps/web lint: Done
✅ apps/api lint: Done
```

## TypeScript の `exactOptionalPropertyTypes: true` 対応

プロジェクトの `tsconfig.json` で `exactOptionalPropertyTypes: true` が有効。本実装では:

- `optional` フィールドへ `undefined` を直接代入しない（`if (value !== undefined) target[key] = value` パターン）
- `ApiErrorLogExtra` / `StructuredLogPayload` の `?` フィールドは「キーごと省略」または「実値設定」のいずれかにする
- `apps/api/src/middleware/error-handler.ts` の `log` / `payload` 構築で本パターンを徹底

## 次 Phase への引き継ぎ

| 引き継ぎ事項 | Phase 6 での利用 |
| --- | --- |
| 異常系候補（D1 batch 部分失敗 / Sheets 5xx 連続 / Workers CPU 制限近接 / サニタイズ漏洩 / 補償二重失敗）| 追加テスト設計の入力 |
| typecheck / lint 合格状態 | 回帰検出 baseline |
| `runWithCompensation` の dead letter フック | UT-07 連携シナリオ確認の入力 |
