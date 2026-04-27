# 異常系テスト設計（Phase 6 成果物）

## 前提

- 本プロジェクトには現状 vitest 等のテストランナーが未導入のため、テストは設計仕様として記述する
- Phase 5 実装の「型レベル契約」「目視コードレビュー」「エラー流通シナリオ机上検証」で代替確認を実施

## 異常系テストケース（7 ケース）

| # | 対象 | テストケース | 期待挙動 | 実装側根拠 |
| --- | --- | --- | --- | --- |
| 1.1 | `runWithCompensation` | 3 ステップ中 2 ステップ目で UNIQUE 制約違反 | ステップ 1 の compensation のみ実行（逆順 1 件）、`UBM-5001` を throw | `transaction.ts` 32-46（rollback 関数） |
| 1.2 | `withRetry` | Sheets API 5xx を連続 N 回返す | `maxAttempts` 到達後 `UBM-6001` を throw、`log.cause` に最終 error | `retry.ts` 92-99（最終 throw） |
| 1.3 | `withRetry` | `signal.aborted = true` を初期から設定 | リトライ前に `AbortError`（`DOMException("Aborted")`）throw | `retry.ts` 80-82（attempt loop 先頭での abort チェック） |
| 1.4 | `errorHandler` | `cause` chain 深さ 3（A→B→C） | response body には `cause` を含めない（`toClientJSON()` ホワイトリスト）、log には `cause.name`/`message` のみ shallow 記録 | `error-handler.ts` 60-64（`cause` 整形）+ `errors.ts` `toClientJSON()` |
| 1.5 | `errorHandler` | レスポンス書込中に Hono が二重 send を試行 | 本実装は `Response` オブジェクトを return する単一経路のみ。Hono ランタイム側で二重 send は発生しない（onError の戻り値が最終 Response）| `error-handler.ts` 全体（Response を return する単一形式）|
| 1.6 | `runWithCompensation` | 2 ステップ目失敗 → 1 ステップ目の compensation 自体が throw（二重失敗）| `recordDeadLetter` フックを呼び、`UBM-5101` を throw、`originalCause` と `compensationFailures` を含む | `transaction.ts` 39-44（compensationFailures 蓄積）+ 49-52（5101 throw）|
| 1.7 | `withRetry` | `classify(err) === "stop"` を返すエラー | バックオフを呼ばず即時 re-throw（fake timer 進行 0 を保証）| `retry.ts` 86-88（stop 分岐）|

## モック戦略

| 対象 | モック方法 |
| --- | --- |
| D1 batch 部分失敗 | `db.prepare(...).bind(...).run()` を `mock.fn()` で `n` 回目に reject |
| Sheets API 5xx | `globalThis.fetch` を `vi.fn().mockResolvedValueOnce(new Response("...", { status: 503 }))` |
| `AbortSignal` | `AbortController` を生成し `controller.abort()` で発火 |
| fake timer | `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(ms)` |
| `console.error/warn` | `vi.spyOn(console, "error")` |

## エッジケース カバレッジ

| 観点 | カバー |
| --- | --- |
| 部分失敗（D1 batch）| ✅ 1.1 |
| リトライ上限到達 | ✅ 1.2 |
| Workers CPU 制限近接（abort） | ✅ 1.3 |
| 例外チェイン（cause）漏洩防止 | ✅ 1.4 |
| 二重 send 回避（実装的に発生しない設計）| ✅ 1.5 |
| 補償二重失敗 | ✅ 1.6 |
| 即時失敗（バックオフなし）| ✅ 1.7 |

## 実装欠落の有無

机上検証の結果、Phase 5 実装で以下が満たされていることを確認:

- ✅ `runWithCompensation` の rollback 逆順実行（`transaction.ts` 71-79）
- ✅ `runWithCompensation` の二重失敗時 `UBM-5101` 採用（同 49-52）
- ✅ `runWithCompensation` の `recordDeadLetter` 呼び出し（同 33-44）
- ✅ `withRetry` の最大試行回数到達時 `failureCode` で throw（`retry.ts` 92-99）
- ✅ `withRetry` の totalTimeoutMs 超過時 `UBM-6002` throw（同 78-80, 109-115）
- ✅ `withRetry` の Workers cap（maxAttempts ≤ 2）+ 警告ログ（同 70-77）
- ✅ `errorHandler` の `cause` shallow 記録（response body 非露出）（`error-handler.ts` 60-64）

実装欠落なし。Phase 5 への差し戻しは不要。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | エッジケース 7 件をカバレッジ計測対象に含める |
| Phase 8 | rollback ロジックの DRY 整理候補（compensation 失敗のログ出力が transaction.ts と logging.ts で重複しないか確認）|
