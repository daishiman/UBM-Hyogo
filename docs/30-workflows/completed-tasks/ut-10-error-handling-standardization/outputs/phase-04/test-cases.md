# テストケース一覧（Phase 4 成果物）

総ケース数: 29

## 1. `packages/shared/src/__tests__/errors.test.ts`（7 ケース）

| # | テストケース名 | 検証観点 | 期待結果 |
| --- | --- | --- | --- |
| 1.1 | `ApiError constructor accepts code/status/title/detail/type/instance and exposes them as readonly props` | RFC 7807 + UBM 拡張 | code/title/status/detail/type/instance が readonly でアクセス可能 |
| 1.2 | `toClientJSON() returns RFC 7807 keys + UBM code/traceId only` | クライアント view ホワイトリスト | `stack`/`sqlStatement` 等が JSON 出力に含まれない |
| 1.3 | `instance defaults to urn:uuid:* when omitted` | 自動採番 | regex `/^urn:uuid:[0-9a-f-]{36}$/` にマッチ |
| 1.4 | `UBM_ERROR_CODES exports all expected categories` | コード体系完備 | UBM-1xxx/4xxx/5xxx/6xxx 全 15 件が含まれる |
| 1.5 | `ApiError.fromUnknown normalizes Error/string/unknown` | 入口正規化 | 任意の値が `instanceof ApiError` で返る |
| 1.6 | `ApiError extends Error (instanceof Error === true)` | 例外チェイン互換 | try/catch の Error 検出と互換 |
| 1.7 | `constructor throws when code is outside UBM taxonomy` | 不正値ガード | `new ApiError({ code: "OTHER-1" as any })` で throw |

## 2. `packages/shared/src/__tests__/retry.test.ts`（7 ケース）

| # | テストケース名 | 検証観点 | 期待結果 |
| --- | --- | --- | --- |
| 2.1 | `withRetry calls fn once on success` | 正常系 | `fn` が 1 回のみ呼ばれる |
| 2.2 | `withRetry throws ApiError(UBM-6001) after maxAttempts` | 上限契約 | maxAttempts=2 失敗後に UBM-6001 throw |
| 2.3 | `withRetry uses exponential backoff (baseDelayMs * 2^n)` | バックオフ | fake timer で delay 進行検証 |
| 2.4 | `withRetry stops immediately when classify returns "stop"` | 非リトライ | 1 回のみ呼ばれて re-throw |
| 2.5 | `withRetry respects AbortSignal` | キャンセル | abort 後に AbortError throw、リトライ停止 |
| 2.6 | `withRetry throws UBM-6002 when totalTimeoutMs exceeded` | タイムアウト | 累計超過で UBM-6002 |
| 2.7 | `withRetry caps maxAttempts at 2 in Workers runtime` | Workers 制約 | maxAttempts=5 → 実効 2、警告ログ確認 |

## 3. `packages/shared/src/__tests__/transaction.test.ts`（5 ケース）

| # | テストケース名 | 検証観点 | 期待結果 |
| --- | --- | --- | --- |
| 3.1 | `runWithCompensation does not call compensation on full success` | happy path | compensate 未呼び出し |
| 3.2 | `runWithCompensation calls compensation in reverse order on mid-failure` | ロールバック | 成功済みステップのみ逆順 compensate |
| 3.3 | `runWithCompensation throws UBM-5101 when compensation itself fails` | 二重失敗 | UBM-5101、cause チェーンに保持 |
| 3.4 | `runWithCompensation calls recordDeadLetter on failure` | DLQ | 失敗時に必ず recordDeadLetter フック呼び出し |
| 3.5 | `private _buildCompensationPlan can be tested via cast (Feedback P0-09-U1 compliant)` | private 検証 | `(facade as unknown as Private)._buildCompensationPlan` で検証 |

## 4. `apps/api/src/middleware/__tests__/error-handler.test.ts`（6 ケース）

| # | テストケース名 | 検証観点 | 期待結果 |
| --- | --- | --- | --- |
| 4.1 | `unknown thrown error is normalized to ApiError(UBM-5000) and returns 500` | 入口正規化 | status 500、code: UBM-5000 |
| 4.2 | `5xx response body does not contain stack/private_key/SQL/token` | 機密非開示 | regex で `/stack|private_key|INSERT INTO|Bearer /` が含まれない |
| 4.3 | `4xx ApiError detail is forwarded to client` | UX 整合 | detail フィールドがそのまま返る |
| 4.4 | `console.error emits structured JSON one line with code/status/requestId/instance` | 構造化ログ | JSON.parse 成功、必須キー確認 |
| 4.5 | `Content-Type is application/problem+json` | RFC 7807 | header 検証 |
| 4.6 | `traceId in response equals instance and matches log entry` | トレース整合 | response body と log の値が一致 |

## 5. `apps/api/src/__tests__/error-handler.integration.test.ts`（4 ケース）

| # | テストケース名 | 検証観点 | 期待結果 |
| --- | --- | --- | --- |
| 5.1 | `app integration: throw new ApiError in route returns expected status+body` | E2E 経路 | app.request() で status/body が ApiError 仕様通り |
| 5.2 | `auth middleware throwing UBM-4001 returns 401 with RFC 7807 body` | 認証連携 | 401 + problem+json |
| 5.3 | `unknown route returns UBM-1404 in ApiError shape` | 既存 404 統一 | notFound ハンドラ経由で UBM-1404 |
| 5.4 | `apps/web api-client parses returned JSON as ApiError-compatible type` | クライアント整合 | TypeScript 型レベルで `ApiErrorClientView` 互換 |

## サニタイズキー検証ケース（4.2 補強）

| サニタイズ対象 | 確認方法 |
| --- | --- |
| `authorization` ヘッダ | request header に `Authorization: Bearer ...` を載せ、ログ context.headers.authorization が `[REDACTED]` |
| `private_key` | `error.context.private_key = "BEGIN PRIVATE KEY..."` をセット、ログ出力で `[REDACTED]` |
| 200 文字超 string | 1000 文字の dummy 文字列、`...[truncated:1000 chars]` で末尾省略 |
| 循環参照 | `obj.self = obj`、`[Circular]` に置換 |

## 完了条件チェック

- [x] 5 ファイル / 29 ケースを設計
- [x] Issue #12 完了条件の検証可能項目すべてに対応テストが紐づく（AC-1〜AC-7 マッピング: 後述）
- [x] private 方針が `(facade as unknown as Private)` キャスト方式
- [x] 命名規則整合（Phase 1 inventory）に準拠
- [x] 機密非開示テストがレスポンス（4.2）+ ログ（4.4 + サニタイズ補強）で定義
- [ ] vitest 実行による RED 確認 → red-confirmation.md で「infra 未導入のため設計レベルで完了」と記録

## AC ↔ テストケース対応表

| AC | カバーするケース |
| --- | --- |
| AC-1（型定義配置）| 1.1 / 1.2 / 1.4 / 1.5 / 1.6 |
| AC-2（ミドルウェア実装）| 4.1 / 4.5 / 4.6 / 5.1 |
| AC-3（漏洩なし）| 4.2 / 4.4 / サニタイズ補強 |
| AC-4（withRetry）| 2.1 〜 2.7 全て |
| AC-5（補償処理サンプル）| 3.1 〜 3.5 全て |
| AC-6（設計ドキュメント）| Phase 5 で `apps/api/docs/error-handling.md` 作成、Phase 7 でファイル存在確認 |
| AC-7（クライアント整合）| 5.4 |
