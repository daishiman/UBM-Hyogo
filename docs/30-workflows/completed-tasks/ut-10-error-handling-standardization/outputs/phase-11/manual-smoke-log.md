# 自動 smoke 実行ログ（Phase 11 主証跡）

## 実行環境

| 項目 | 値 |
| --- | --- |
| 日時 | 2026-04-27T00:26:39Z |
| Node | 24.15.0（mise 管理） |
| pnpm | 10.33.2 |
| Branch | feat/wt-4 |
| Worktree | .worktrees/task-20260427-063447-wt-4 |

## S-1: apps/api 起動 → 意図的 500 発火

### 計画

```
1. mise exec -- pnpm --filter @ubm-hyogo/api dev
2. curl -i http://localhost:8787/__debug/throw
3. レスポンスを確認: Content-Type: application/problem+json, body に stack/SQL/token なし
```

### 実行結果

| ステップ | 結果 | 備考 |
| --- | --- | --- |
| 1. dev サーバー起動 | 未実行 | NON_VISUAL のため代替検証で対応 |
| 2. curl smoke | 未実行 | `/__debug/throw` エンドポイント未実装（既知制限 L-10） |
| 3. レスポンス検証 | 代替実施 | 下記「代替検証」参照 |

### 代替検証

| 確認項目 | 結果 | 根拠 |
| --- | --- | --- |
| `errorHandler` 実装存在 | ✅ | `apps/api/src/middleware/error-handler.ts`（98 行） |
| Hono `app.onError` 配線 | ✅ | `apps/api/src/index.ts:11` `app.onError(errorHandler)` |
| Hono `app.notFound` 配線 | ✅ | `apps/api/src/index.ts:10` `app.notFound(notFoundHandler)` |
| Content-Type 設定 | ✅ | `error-handler.ts:35` `"Content-Type": "application/problem+json"` |
| stack/SQL/token 排除 | ✅ | `toClientJSON()` ホワイトリスト 7 キーで構造的に排除 |
| ENV 別 debug 制御 | ✅ | `error-handler.ts:23` `c.env?.ENVIRONMENT === "development"` 判定 |

判定: **CONDITIONAL PASS**（実行ログなし、コードレビュー + 型レベル検証で代替）

## S-2: Sheets API 5xx 模擬 → withRetry リトライ後失敗

### 計画

```
mise exec -- pnpm --filter @ubm-hyogo/shared test -- retry
```

### 実行結果

```
$ mise exec -- pnpm --filter @ubm-hyogo/shared test -- retry
ERR_PNPM_NO_SCRIPT  Missing script: test
```

vitest 未導入のため `test` スクリプトが定義されていない（既知制限 L-9）。

### 代替検証

| 確認項目 | 結果 | 根拠 |
| --- | --- | --- |
| `withRetry` 実装存在 | ✅ | `packages/shared/src/retry.ts:135 行` |
| 最大試行回数到達時 throw | ✅ | retry.ts 内で最終 attempt 後に `failureCode` (`UBM-6001`) で throw |
| 指数バックオフ | ✅ | `delay(baseDelayMs * 2^attempt)` を実装、`DEFAULT_MAX_DELAY_PER_SLEEP_MS = 200ms` で clamp |
| Workers cap | ✅ | `WORKERS_MAX_ATTEMPTS_CAP = 2` で警告ログ + cap 適用 |
| AbortSignal 連動 | ✅ | attempt loop 先頭 + delay 内で abort チェック |
| totalTimeoutMs 超過 | ✅ | timeout 超過時 `UBM-6002` で throw |
| 設計テストケース | ✅ | Phase 4 test-cases.md 2.1〜2.7 + Phase 6 edge-case-tests.md 1.2 / 1.3 / 1.7 |

判定: **CONDITIONAL PASS**（vitest 未導入、設計 + コード整合で代替）

## S-3: D1 batch 部分失敗 → 補償処理

### 計画

```
mise exec -- pnpm --filter @ubm-hyogo/shared test -- transaction
```

### 実行結果

```
$ mise exec -- pnpm --filter @ubm-hyogo/shared test -- transaction
ERR_PNPM_NO_SCRIPT  Missing script: test
```

vitest 未導入。

### 代替検証

| 確認項目 | 結果 | 根拠 |
| --- | --- | --- |
| `runWithCompensation` 実装存在 | ✅ | `packages/shared/src/db/transaction.ts:85 行` |
| 順次 execute | ✅ | for-of で steps を順次実行 |
| 失敗時 逆順 compensate | ✅ | compensation 配列を `reverse()` で逆順実行 |
| 二重失敗時 `UBM-5101` | ✅ | compensation 中の失敗を `compensationFailures` に集約、`UBM-5101` で throw |
| `recordDeadLetter` フック | ✅ | options.recordDeadLetter があれば best-effort で呼び出し |
| 設計テストケース | ✅ | Phase 4 test-cases.md 3.1〜3.5 + Phase 6 edge-case-tests.md 1.1 / 1.6 |

判定: **CONDITIONAL PASS**

## S-4: 構造化ログフォーマット

### 計画

```
mise exec -- pnpm --filter @ubm-hyogo/shared test -- logging
```

### 実行結果

```
$ mise exec -- pnpm --filter @ubm-hyogo/shared test -- logging
ERR_PNPM_NO_SCRIPT  Missing script: test
```

vitest 未導入。

### 代替検証

| 確認項目 | 結果 | 根拠 |
| --- | --- | --- |
| `logError`/`logWarn`/`logInfo`/`logDebug` 実装 | ✅ | `packages/shared/src/logging.ts:103 行`、4 関数 export |
| JSON 1 行出力 | ✅ | `console.error(JSON.stringify(payload))` 形式 |
| `sanitize` substring REDACT | ✅ | `SENSITIVE_KEY_SUBSTRINGS` 11 件で REDACT |
| 200 文字 truncate | ✅ | 文字列長 > 200 で `...[truncated:N chars]` |
| 循環参照 [Circular] | ✅ | `WeakSet` ベースで検出 |
| Error 整形 | ✅ | `name`/`message`/`stackPreview`(先頭 5 行) のみ抽出 |
| 必須フィールド | ✅ | `code`/`status`/`message`/`traceId`/`instance`/`requestId`/`method`/`path` |
| 設計テストケース | ✅ | Phase 4 test-cases.md 4.4 + Phase 6 security-leak-tests.md 3.4 + structured-log-format.md |

判定: **CONDITIONAL PASS**

## S-5: apps/web ApiError 型同期

### 計画

```
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

### 実行結果

```
$ mise exec -- pnpm typecheck

> ubm-hyogo@0.1.0 typecheck /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260427-063447-wt-4
> pnpm -r typecheck

Scope: 4 of 5 workspace projects
packages/shared typecheck: Done
apps/web typecheck: Done
packages/integrations typecheck: Done
apps/api typecheck: Done
```

Exit code 0、4 workspace projects 全件 Done。

### 検証

| 確認項目 | 結果 | 根拠 |
| --- | --- | --- |
| `apps/web/app/lib/api-client.ts` の型 import | ✅ | `import type { ApiErrorClientView, UbmErrorCode } from "@ubm-hyogo/shared/errors"` |
| 契約整合 (`isApiErrorClientView` type predicate) | ✅ | typecheck PASS |
| subpath 解決 | ✅ | `@ubm-hyogo/shared/errors` が pnpm + tsc で解決 |

判定: **PASS**

## 総合サマリー

| # | 結果 |
| --- | --- |
| S-1 | CONDITIONAL PASS（curl smoke 不可、コードレビュー代替）|
| S-2 | CONDITIONAL PASS（vitest 未導入、設計レベル代替）|
| S-3 | CONDITIONAL PASS（同上）|
| S-4 | CONDITIONAL PASS（同上）|
| S-5 | ✅ PASS（typecheck exit 0）|

総合: **CONDITIONAL GO**（vitest 未導入の既知の限界 L-9 が主因。Phase 10 で GO 判定済み）

## 再現コマンド

```bash
# S-5 のみ実行可能
mise exec -- pnpm typecheck

# S-1 〜 S-4 は将来 vitest + debug throw エンドポイント実装後に有効化
# mise exec -- pnpm --filter @ubm-hyogo/shared test -- retry
# mise exec -- pnpm --filter @ubm-hyogo/shared test -- transaction
# mise exec -- pnpm --filter @ubm-hyogo/shared test -- logging
# pnpm --filter @ubm-hyogo/api dev &
# curl -i http://localhost:8787/__debug/throw
```
