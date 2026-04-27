# カバレッジマトリクス（Phase 7 成果物）

## 関心ごと × テスト × 担当ファイル

| 関心ごと | 担当ファイル | カバーするテスト | 種別 |
| --- | --- | --- | --- |
| ApiError 構築 | errors.ts | 1.1 | line + branch |
| ApiError シリアライズ（toClientJSON）| errors.ts | 1.2 / 4.6 | line |
| instance 自動採番 | errors.ts | 1.3 | branch（省略時 fallback） |
| UBM_ERROR_CODES 完備 | errors.ts | 1.4 / 回帰 2.2 | line |
| `fromUnknown` 正規化（Error/string/unknown）| errors.ts | 1.5 | branch（3 分岐）|
| `instanceof Error` 互換 | errors.ts | 1.6 | line |
| 不正コード reject | errors.ts | 1.7 | branch |
| `withRetry` 成功 1 回呼び出し | retry.ts | 2.1 | line |
| `withRetry` 上限到達 → UBM-6001 | retry.ts | 2.2 / 異常系 1.2 | line |
| 指数バックオフ | retry.ts | 2.3 | branch（attempt 増加）|
| 非リトライ判定（stop）| retry.ts | 2.4 / 異常系 1.7 | branch |
| AbortSignal | retry.ts | 2.5 / 異常系 1.3 | branch（abort 2 箇所）|
| totalTimeoutMs 超過 → UBM-6002 | retry.ts | 2.6 | branch（timeout 2 箇所）|
| Workers maxAttempts cap | retry.ts | 2.7 | branch（cap 警告分岐） |
| `defaultClassify` ApiError 分岐 | retry.ts | 2.4 | branch |
| `defaultClassify` 5xx/429/timeout 分岐 | retry.ts | 異常系 1.2 + 補助 | branch |
| `delay` AbortSignal 連動 | retry.ts | 2.5 | branch |
| `runWithCompensation` happy path | db/transaction.ts | 3.1 | line |
| 補償処理 逆順実行 | db/transaction.ts | 3.2 / 異常系 1.1 | line + branch |
| 補償処理 二重失敗 → UBM-5101 | db/transaction.ts | 3.3 / 異常系 1.6 | branch |
| `recordDeadLetter` 呼び出し | db/transaction.ts | 3.4 | branch（DLQ 有無）|
| Private `_buildCompensationPlan` 検証 | db/transaction.ts | 3.5 | – |
| DLQ 自体の失敗（best-effort）| db/transaction.ts | （拡張）| branch |
| 構造化ログ JSON 1 行出力 | logging.ts | 4.4 | line |
| sanitize substring REDACT | logging.ts | security 3.4 / サニタイズ補強 | branch |
| sanitize 200 文字 truncate | logging.ts | サニタイズ補強 | branch |
| sanitize 循環参照 → [Circular] | logging.ts | サニタイズ補強 | branch |
| sanitize Error 整形 | logging.ts | error-handler.test.ts 4.4 | branch |
| sanitize Array / object / scalar | logging.ts | サニタイズ補強 | branch |
| `errorHandler` 未捕捉 → UBM-5000 正規化 | middleware/error-handler.ts | 4.1 / 5.1 | line |
| `errorHandler` 5xx body 機密非開示 | middleware/error-handler.ts | 4.2 / security 3.1-3.3 | branch（status >= 500）|
| `errorHandler` 4xx detail 透過 | middleware/error-handler.ts | 4.3 / 5.4 | branch |
| `errorHandler` 構造化ログ出力 | middleware/error-handler.ts | 4.4 | line |
| `errorHandler` Content-Type | middleware/error-handler.ts | 4.5 / 回帰 2.3 | line |
| `errorHandler` traceId 整合 | middleware/error-handler.ts | 4.6 / 回帰 2.4 | line |
| 開発環境 debug 付与 | middleware/error-handler.ts | （拡張）| branch（env 分岐）|
| `notFoundHandler` → UBM-1404 | middleware/error-handler.ts | 5.3 | branch |
| URL parse 失敗 fallback | middleware/error-handler.ts | （未到達 → c8 ignore 候補）| branch |
| 認証連携（UBM-4001 401）| middleware/error-handler.ts + handler | 5.2 | line |
| `apps/web` parseApiResponse 契約 | apps/web/app/lib/api-client.ts | 5.4 / 回帰 2.5 | – |

## 関心 × テスト数の集計

| 関心領域 | 関心数 | カバー数 |
| --- | --- | --- |
| ApiError | 7 | 7 |
| withRetry | 9 | 9 |
| runWithCompensation | 6 | 6 |
| logging（sanitize 含む）| 6 | 6 |
| errorHandler | 9 | 9 |
| クライアント整合 | 1 | 1 |
| 合計 | 38 | 38 |

すべての関心ごとに少なくとも 1 つのテストが対応している（マトリクス完備）。

## カバレッジ低下リスクの観点

| Phase | 影響 |
| --- | --- |
| Phase 8（DRY 整理）| 重複排除によりテストケース対応箇所が変わる場合は coverage-matrix を更新する必要あり |
| Phase 9（品質保証）| typecheck/lint で本マトリクスの実装ファイルが減らないことを確認 |

## 完了条件チェック

- [x] 38 関心 × テストの対応が確定
- [x] 各関心ごとに 1 件以上のテストカバーあり
- [x] 担当ファイルが 5 ファイルに収束
