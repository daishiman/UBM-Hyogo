# 設計レビューレポート（Phase 3 成果物）

## レビュー対象

- `outputs/phase-02/api-error-schema.md`
- `outputs/phase-02/error-code-taxonomy.md`
- `outputs/phase-02/error-handler-middleware-design.md`
- `outputs/phase-02/retry-strategy-design.md`
- `outputs/phase-02/d1-compensation-pattern.md`
- `outputs/phase-02/structured-log-format.md`

## レビューチェックリスト判定（10 項目）

| # | 項目 | 判定 | 備考 |
| --- | --- | --- | --- |
| 1 | `ApiError` 型が RFC 7807 の 5 フィールドを保持し、`code` 拡張が衝突していない | PASS | `type/title/status/detail/instance` 全て保持。`code`/`traceId` は標準キーと別名 |
| 2 | エラーコード体系の 4 大区分が網羅的で、HTTP ステータスコードと対応が取れている | PASS | UBM-1xxx/4xxx/5xxx/6xxx で 4xx/5xx 全範囲をカバー。`UBM_ERROR_CODES` 表で 1:1 対応 |
| 3 | `errorHandler` が既知 / 未知例外を分岐し、内部詳細を strip する設計 | PASS | `isApiError` 分岐 + `toClientJSON()` ホワイトリスト |
| 4 | `withRetry` が Cron / Queues 主戦略・in-request bounded retry 補助の二段構成 | PASS | Workers 制約丸め込み（maxAttempts ≤ 2）と totalTimeoutMs を明示 |
| 5 | D1 補償処理が冪等性キーと dead letter 記録を含む | PASS | `runWithCompensation` + `recordDeadLetter` フック設計 |
| 6 | 構造化ログのサニタイズキーリストが PII・認証情報を網羅 | PASS | `private_key/client_email/authorization/cookie/token/secret/credential/session/api_key` を含む |
| 7 | クライアント／サーバー分離がホワイトリスト方式で強制される | PASS | `toClientJSON()` がホワイトリスト fields のみを返す不変条件 INV-4/M2 で担保 |
| 8 | `@ubm-hyogo/shared` 配置が Hono 依存を持ち込まない | PASS | `errors.ts/retry.ts/db/transaction.ts/logging.ts` はすべて framework non-dependent。Hono 依存は `apps/api/src/middleware/error-handler.ts` のみ |
| 9 | UT-09 / UT-07 / UT-08 が利用するフックポイントが明示されている | PASS | UT-09: `withRetry`/`runWithCompensation`、UT-07: `recordDeadLetter`、UT-08: `StructuredLogPayload` スキーマ |
| 10 | 開発環境例外が staging / production で無効化される | PASS | `c.env.ENVIRONMENT === "development"` 分岐で `debug` 付与のみ。production は strip |

集計:
- PASS: 10
- MINOR: 0
- MAJOR: 0

## 5 観点レビュー

### 1. RFC 7807 準拠性

| 観点 | 判定 | 詳細 |
| --- | --- | --- |
| 5 標準フィールド保持 | PASS | type/title/status/detail/instance を `ApiErrorClientView` で保持 |
| Content-Type | PASS | `application/problem+json` を強制（INV-M1）|
| 標準フィールド非上書き | PASS | UBM 拡張は `code`/`traceId` のみで標準フィールドと衝突しない |

### 2. Workers 制約整合

| 観点 | 判定 | 詳細 |
| --- | --- | --- |
| `setTimeout` 長時間 sleep 不使用 | PASS | retry 設計で `delay <= 200ms` を強制（超過時は警告ログ）|
| ネスト TX 不可前提 | PASS | `runWithCompensation` で明示的 compensation を採用、batch ロールバックに依存しない |
| request lifetime 内完結 | PASS | totalTimeoutMs（既定 800ms）+ maxAttempts ≤ 2 で CPU 制限内に収まる |
| Cron / Queues 利用判断と無料枠 | PASS | Cron は既存無料枠で稼働、Queues は採用見送り（有償） |

### 3. `@ubm-hyogo/shared` 配置妥当性

| 観点 | 判定 | 詳細 |
| --- | --- | --- |
| Workspace 構造整合 | PASS | `packages/shared/src/{errors,retry,logging}.ts` + `db/transaction.ts` の階層は既存と整合 |
| Hono 等の app 依存非混入 | PASS | shared 側は型 + 純粋関数のみ。Hono は `apps/api/middleware/` に閉じる |
| 副作用配置 | PASS | `console.error` 呼び出しのみが副作用。logger ヘルパでカプセル化 |

### 4. 下流タスク引き継ぎ容易性

| 観点 | 判定 | 詳細 |
| --- | --- | --- |
| UT-09 利用容易性 | PASS | `withRetry(fetchSheetRows, SHEETS_RETRY_PRESET)` + `runWithCompensation([upsert, audit])` の 2 行で組み込める |
| UT-07 利用容易性 | PASS | `recordDeadLetter` フックを通知連携の起点として利用可能 |
| UT-08 利用容易性 | PASS | `StructuredLogPayload` を `zod` で validate して取り込む想定。共通型を import 可能 |

### 5. 機密情報非開示

| 観点 | 判定 | 詳細 |
| --- | --- | --- |
| ホワイトリスト方式 | PASS | `toClientJSON()` がホワイトリストキーのみを返す。logging は別経路でサニタイズ |
| 開発環境例外の無効化 | PASS | `ENVIRONMENT === "development"` 判定でのみ `debug` 付与 |
| サニタイズキー網羅 | PASS | substring マッチで 11 種類のキーを REDACTED 化 |

## 代替案検討

### A. エラーレスポンス標準

| 案 | 採用 | 理由 |
| --- | --- | --- |
| RFC 7807 (Problem Details) | ✅ | 業界標準、既存 client（zod 等）と整合容易 |
| 独自 JSON スキーマ | ❌ | 拡張性低、既存 SDK との互換性なし |
| GraphQL errors 風 | ❌ | REST API 中心の本構成と不整合 |

### B. リトライ戦略

| 案 | 採用 | 理由 |
| --- | --- | --- |
| Cron 主戦略 + in-request bounded retry | ✅ | Workers 無料枠で完結、即時 UX 改善 + 確実な再処理を両立 |
| Cloudflare Queues 主戦略 | ❌ | 有償可能性。MVP では過剰 |
| in-request 大規模リトライのみ | ❌ | Workers CPU 制限超過リスク |

### C. D1 補償処理

| 案 | 採用 | 理由 |
| --- | --- | --- |
| compensating transaction（明示的 compensate）| ✅ | D1 制約に最適。step 単位の柔軟性 |
| 冪等性キー + 全件再実行 | △ | 単純だが副作用が広い・処理量大 |
| 2 phase commit 風 | ❌ | D1 では実装不能 |

→ メイン採用は compensating transaction、ステップ実装側は冪等性で補強する二段構え。

## 4 条件評価結果

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 共通基盤化で UT-09/07/08 の実装コスト大幅減 |
| 実現性 | PASS | Workers 制約全項目に対応設計あり |
| 整合性 | PASS | RFC 7807 / 既存 API / 認証仕様と矛盾なし |
| 運用性 | PASS | ホワイトリスト + 自動サニタイズで漏洩防止が機械強制 |

## 既知のリスク・後続フォロー事項

| # | リスク | 対応 | 担当 Phase |
| --- | --- | --- | --- |
| R-1 | テスト infra（vitest）未導入のため Phase 4 RED 確認はファイル設計レベルに留まる | Phase 4 で test-design.md を充実させ、Phase 9 で typecheck/lint を主軸に検証 | Phase 4 / 9 |
| R-2 | `apps/web/app/lib/api-client.ts` が現状未配置 | Phase 5 で minimal な型整合用ファイルを作成（API クライアントは UI 実装時に拡張）| Phase 5 |
| R-3 | dead letter の専用テーブルなし | MVP は `sync_audit.error_reason` JSON で代替、将来 UT-07 で再評価 | UT-07 |
| R-4 | TypeScript 6 (`exactOptionalPropertyTypes: true`) の制約 | optional フィールド扱いに注意（明示的に `undefined` を渡さない、または `?:` で型定義）| Phase 5 |
| R-5 | `as const satisfies` 構文使用 | TypeScript 4.9+ で動作。プロジェクト TS 6.0.3 で問題なし | – |

## 結論

**全 10 項目 PASS、MAJOR / MINOR ともに 0 件。GO 判定。**

Phase 4（テスト作成）に進行可能。
