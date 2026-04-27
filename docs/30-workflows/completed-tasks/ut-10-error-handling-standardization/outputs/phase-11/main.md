# Phase 11 main（NON_VISUAL smoke 総括）

## NON_VISUAL 宣言

UT-10 はバックエンド共通基盤と SDK 標準化のみを対象とし、ユーザー操作可能な UI 画面を生み出さない **NON_VISUAL** タスクである。

- UI 表示・画面遷移・ユーザー操作の追加なし
- 実地操作（manual smoke）は不可
- 代替証跡として **(a) 自動 smoke 結果（typecheck/lint PASS + 設計済みテストケース）+ (b) 既知制限リスト** を本 Phase で記録
- スクリーンショット非作成（screenshot-plan.json で `mode: "NON_VISUAL"` を明示）

## S-1〜S-5 総合判定

| # | 対象 | 実行可能性 | 結果 | 代替証跡 |
| --- | --- | --- | --- | --- |
| S-1 | apps/api 起動 → 意図的 500 発火 | ⚠️ 部分実行 | CONDITIONAL PASS | `apps/api/src/middleware/error-handler.ts` 実装済み + onError/notFound 配線済み（`apps/api/src/index.ts:9-10`）。debug throw エンドポイント未実装のため curl smoke 不可。型レベル + 設計検証で代替 |
| S-2 | Sheets API 5xx 模擬 → withRetry リトライ後失敗 | ⚠️ 設計のみ | CONDITIONAL PASS | vitest 未導入のため `pnpm test` 不可。Phase 6 edge-case-tests.md 1.2 + 1.3 で設計完備、Phase 5 実装で `withRetry` の最大試行回数到達時 `UBM-6001` throw を確認 |
| S-3 | D1 batch 部分失敗 → 補償処理 | ⚠️ 設計のみ | CONDITIONAL PASS | 同上。Phase 6 edge-case-tests.md 1.1 + 1.6 で設計完備、Phase 5 実装で `runWithCompensation` の逆順 compensate / 二重失敗時 `UBM-5101` を確認 |
| S-4 | 構造化ログフォーマット | ⚠️ 設計のみ | CONDITIONAL PASS | 同上。Phase 6 security-leak-tests.md 3.4 + structured-log-format.md で設計完備、Phase 5 実装で sanitize + REDACT 11 件を確認 |
| S-5 | apps/web ApiError 型同期 | ✅ 実行 | PASS | `mise exec -- pnpm typecheck` exit 0、`apps/web/app/lib/api-client.ts` が `@ubm-hyogo/shared/errors` を type import |

総合判定: **CONDITIONAL GO**（vitest 未導入による既知の限界、AC-2 と同じ理由。Phase 10 で GO 判定済み）

## 主証跡

| 証跡種別 | 所在 |
| --- | --- |
| 自動 smoke (S-5 typecheck) 実行ログ | manual-smoke-log.md |
| 設計レベル smoke (S-1〜S-4) | manual-smoke-log.md + Phase 6 outputs |
| 既知制限リスト | 本ファイル「既知制限」セクション |
| リンク健全性 | link-checklist.md |
| スクリーンショット非作成理由 | screenshot-plan.json |

## 既知制限リスト（Phase 12 へ引き継ぎ）

| # | 既知制限 | 由来 | 委譲先 |
| --- | --- | --- | --- |
| L-1 | Workers in-request での `setTimeout` 長時間ウェイトが許容されない | Cloudflare Workers ランタイム制約 | UT-09（Cron / Queues 経由の遅延リトライで補完） |
| L-2 | in-request リトライは最大 1 回までに限定（`WORKERS_MAX_ATTEMPTS_CAP = 2`） | L-1 から派生 | UT-09（次回実行で再処理を主戦略） |
| L-3 | D1 ネスト TX 非サポートのため、補償処理は明示的逆操作パターンに依存 | Cloudflare D1 制約 | UT-04 / UT-09（`runWithCompensation` template を使用） |
| L-4 | `db.batch()` の部分失敗に対する自動ロールバックがない | Cloudflare D1 制約 | 同上 |
| L-5 | クライアント向けの UI トースト / エラーモーダルの目視確認は本タスクでは行わない | NON_VISUAL タスクのため | UI 実装側タスク（apps/web のエラー表示実装が起票された時点） |
| L-6 | 通知基盤（Slack / メール）への dead letter 連携の E2E 確認 | スコープ外 | UT-07（通知基盤） |
| L-7 | アラート / メトリクスへの構造化ログ取り込み確認 | スコープ外 | UT-08（モニタリング） |
| L-8 | ローカル `wrangler dev` と本番 Workers の挙動差（特に `console.error` の出力先） | 環境差異 | デプロイ後の運用確認 |
| L-9 | vitest 未導入のため S-1〜S-4 の自動 smoke が設計レベル PASS のみ | テストインフラ未整備 | テストインフラ整備タスク（UT-10 スコープ外、未起票） |
| L-10 | debug throw エンドポイント (`/__debug/throw`) 未実装 | 開発環境用デバッグ機構未整備 | 任意で UT-08 等で追加検討 |

## Phase 12 への引き継ぎ事項

- S-5 typecheck PASS
- S-1〜S-4 は CONDITIONAL PASS（vitest 未導入の既知の限界 L-9）
- 既知制限リスト L-1〜L-10
- NON_VISUAL 証跡方針（screenshot-plan.json `mode: "NON_VISUAL"`）
- Phase 10 GO 判定（final-review-report.md）

## 完了条件チェック

- [x] NON_VISUAL 宣言と S-1〜S-5 総合判定が main.md に記載
- [x] 自動 smoke 実行ログが manual-smoke-log.md に時系列で記録
- [x] link-checklist.md の全リンクが解決
- [x] screenshot-plan.json が `mode: "NON_VISUAL"` で生成
- [x] 既知制限リスト L-1〜L-10 が Phase 12 引き継ぎ形式で記録
- [x] 主ソース（自動テスト件数）と非作成理由が証跡メタに明記
