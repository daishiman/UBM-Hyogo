# Phase 5: 実装（TDD Green フェーズ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装（TDD Green フェーズ） |
| 作成日 | 2026-04-27 |
| 前 Phase | 4 (テスト作成 / TDD Red) |
| 次 Phase | 6 (テスト拡充 / 異常系・回帰 guard) |
| 状態 | spec_created |

## 目的

Phase 4 で RED 状態にした全テストを GREEN に遷移させる最小実装を行う。`@ubm-hyogo/shared` への共通基盤配置（ApiError / withRetry / 補償処理 / 構造化ログ）と `apps/api` の Hono `onError` ミドルウェア配線を完了し、Issue #12 の実装系完了条件をすべて満たす。`apps/web` 側は API クライアントの型整合のみを行い、UI 実装は対象外とする。

## 実行タスク

- Task 5-1: Phase 4 の RED テストを baseline として確認し、既存テスト回帰の有無を記録する
- Task 5-2: `@ubm-hyogo/shared` に `ApiError` / `withRetry` / D1 補償処理 / 構造化ログを最小実装する
- Task 5-3: `apps/api` に Hono `onError` ベースの `errorHandler` を配線する
- Task 5-4: `apps/web` API クライアントの `ApiError` 型整合を確認する
- Task 5-5: `apps/api/docs/error-handling.md` と実装証跡を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-04.md | RED テスト定義 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-04/test-plan.md | 実装対象テスト一覧 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/api-error-schema.md | `ApiError` 型仕様 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/error-handler-middleware-design.md | Hono `onError` 設計 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/retry-strategy-design.md | `withRetry` 設計 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/d1-compensation-pattern.md | D1 補償処理方針 |

## 実装計画（[Feedback RT-03] 準拠）

### 新規作成ファイル

| パス | 役割 | 主な export |
| --- | --- | --- |
| `packages/shared/src/errors.ts` | `ApiError` 型 + UBM エラーコード定数 | `ApiError`, `ErrorCode`, `UBM_ERROR_CODES`, `isApiError`, `fromUnknown` |
| `packages/shared/src/retry.ts` | `withRetry` 関数（指数バックオフ・タイムアウト・abort 対応・Workers 制約検出） | `withRetry`, `RetryOptions`, `RetryError` |
| `packages/shared/src/db/transaction.ts` | D1 補償処理パターン（`runWithCompensation`） | `runWithCompensation`, `CompensationStep`, `CompensationFailure` |
| `packages/shared/src/logging.ts` | 構造化ログヘルパ（`logError` / `logWarn`） | `logError`, `logWarn`, `StructuredLogPayload` |
| `apps/api/src/middleware/error-handler.ts` | Hono `onError` 用ハンドラ（5xx 機密マスク・4xx 透過・RFC 7807 ボディ生成） | `errorHandler` |
| `apps/api/docs/error-handling.md` | 設計ドキュメント（外部公開・開発者向け） | — |

### 修正ファイル

| パス | 修正内容 |
| --- | --- |
| `packages/shared/src/index.ts` | 既存 barrel に追加。subpath export を優先（`@ubm-hyogo/shared/errors`, `@ubm-hyogo/shared/retry`, `@ubm-hyogo/shared/db/transaction`, `@ubm-hyogo/shared/logging`）し、root barrel は型再エクスポートのみ ([Feedback W0-01]) |
| `packages/shared/package.json` | `exports` フィールドへ subpath を追加（`./errors`, `./retry`, `./db/transaction`, `./logging`） |
| `apps/api/src/index.ts` | `app.onError(errorHandler)` を Hono アプリ初期化箇所に登録。`app.notFound` でも `UBM-1404` の `ApiError` を投げる |
| `apps/web/app/lib/api-client.ts` | レスポンス JSON を `ApiError` 互換型としてパース。RFC 7807 の `application/problem+json` を判定し、`code` / `instance` を保持 |

> Workers ランタイム制約で `setTimeout` の長時間 sleep は使えないため、`withRetry` は in-request では `maxAttempts` を 2 に丸める。長期リトライは Cron Triggers / Queues 側のリトライ機構に委譲する旨を error-handling.md に明記する。

## 実装手順（テストを GREEN に変える順序）

1. `packages/shared/src/errors.ts` を実装 → `errors.test.ts` を GREEN にする
2. `packages/shared/src/logging.ts` を実装（`errors.ts` を参照しない pure util）→ logging 関連テストを GREEN
3. `packages/shared/src/retry.ts` を実装（`errors.ts` の `ApiError` を使用） → `retry.test.ts` を GREEN
4. `packages/shared/src/db/transaction.ts` を実装 → `transaction.test.ts` を GREEN
5. `packages/shared/src/index.ts` / `package.json` の export を整備
6. `apps/api/src/middleware/error-handler.ts` を実装 → `error-handler.test.ts` を GREEN
7. `apps/api/src/index.ts` に組込 → `error-handler.integration.test.ts` を GREEN
8. `apps/web/app/lib/api-client.ts` の型整合修正 → 契約スナップショットテストを GREEN
9. `apps/api/docs/error-handling.md` を執筆（README リンクから誘導）

各ステップ後に `mise exec -- pnpm --filter @ubm-hyogo/shared test -- --run` および `mise exec -- pnpm --filter @ubm-hyogo/api test -- --run` を実行し、対象テストが GREEN になり既存テストが REGRESS していないことを確認する。

## canUseTool 適用範囲と制約

- 本タスクは Claude Agent SDK（`@anthropic-ai/claude-agent-sdk`）を経由しないため、`canUseTool` フックの導入は **N/A**（[Feedback P0-09-U1-2] 準拠）
- 本実装の例外境界（Hono onError）は SDK の `canUseTool` とは独立して動作する
- 将来 SDK ベースの管理ツールが追加された場合に備え、`apps/api/docs/error-handling.md` で「SDK 経由の `canUseTool` 拒否は HTTP 403 + UBM-4003 にマッピングする」方針のみ記載する

## 実装証跡

- 実装後の vitest サマリー（passed / failed / skipped）を implementation-summary.md に保存
- 変更ファイル一覧（git diff --name-status）を file-change-list.md に保存
- 既存テスト本数比較（変更前 / 変更後）と回帰なし確認を記録

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | RED テスト群の GREEN 化を達成 |
| Phase 6 | 拡充テスト（異常系 / 回帰 guard / セキュリティ leak）の前提実装 |
| Phase 7 | カバレッジ計測対象ファイルの確定 |
| Phase 8 | DRY 観点の重複排除候補（log payload 整形等）入力 |

## 多角的チェック観点（AIが判断）

- 価値性: Issue #12 完了条件 6 項目すべてが実装で満たされているか
- 実現性: Workers サイズ制約（1MB）超過がないか（依存追加禁止・Node 専用 API 不使用）
- 整合性: `apps/web` の API クライアントが新エラー形式と整合しているか
- 運用性: error-handling.md に運用者向けトラブルシュート章があるか
- セキュリティ: 5xx body / log のマスキング実装が漏れていないか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | errors.ts 実装 | 5 | spec_created | ApiError + 定数 |
| 2 | logging.ts 実装 | 5 | spec_created | 構造化ログ |
| 3 | retry.ts 実装 | 5 | spec_created | Workers 制約丸め込み |
| 4 | db/transaction.ts 実装 | 5 | spec_created | 補償処理 |
| 5 | shared barrel / package.json exports 更新 | 5 | spec_created | subpath 優先 |
| 6 | error-handler.ts 実装 | 5 | spec_created | Hono onError |
| 7 | apps/api/src/index.ts 配線 | 5 | spec_created | onError + notFound |
| 8 | apps/web/app/lib/api-client.ts 整合 | 5 | spec_created | 型のみ |
| 9 | apps/api/docs/error-handling.md 執筆 | 5 | spec_created | 設計公開 |
| 10 | GREEN 化検証実行 | 5 | spec_created | filter test 実行 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-summary.md | 実装結果サマリーと vitest GREEN ログ |
| ドキュメント | outputs/phase-05/file-change-list.md | 新規 / 修正ファイル一覧（理由付き） |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 新規 6 ファイルが指定パスに配置されている
- [ ] 修正 4 ファイルが Phase 5 範囲内のみで変更されている（無関係箇所を編集していない）
- [ ] Phase 4 で定義したすべてのテストが GREEN
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/shared test -- --run` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- --run` exit 0
- [ ] 既存テスト本数が減っていない（回帰なし）
- [ ] `apps/api/docs/error-handling.md` に Workers 制約 / リトライ戦略 / 補償処理 / 構造化ログ / クライアント整合の 5 章が含まれる
- [ ] subpath export が `@ubm-hyogo/shared/errors` 等で利用可能
- [ ] Issue #12 完了条件 6 項目すべてが satisfy

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 回帰テスト本数比較が記録されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 6 (テスト拡充 / 異常系・回帰 guard)
- 引き継ぎ事項: implementation-summary.md / file-change-list.md と、Phase 6 で追加すべき異常系入力候補（D1 batch 部分失敗 / Sheets 5xx 連続 / Workers CPU 制限近接）の整理
- ブロック条件: いずれかのテストが RED のまま、または既存テストの回帰が検出されている場合は次 Phase に進まない
