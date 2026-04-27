# 未割当タスク検出（Phase 12 Task 12-4 成果物）

## 検出ソース 5 種すべて確認済み

| # | 検出ソース | 確認結果 |
| --- | --- | --- |
| 1 | 元仕様書（index.md スコープ外）の派生事項 | 該当 4 件（U-2 / U-3 / U-5 / U-6）|
| 2 | Phase 3 / Phase 10 の MINOR 指摘で本タスク内未消化のもの | 該当 2 件（MINOR-1, MINOR-2 → U-5, U-8）|
| 3 | Phase 11 で発見した既知制限（L-1〜L-10）| 該当 7 件（U-1 / U-4 / U-7 / U-9 / U-10 / U-11 / U-12）|
| 4 | 実装内 TODO / FIXME コメント | 0 件（grep `TODO|FIXME` 全実装ファイルでヒットなし）|
| 5 | `describe.skip` / `it.skip` のテストケース | 0 件（vitest 未導入のため該当なし）|

## 検出結果一覧

| # | 検出項目 | 種別 | 検出ソース | 推奨対応 | 割り当て先 |
| --- | --- | --- | --- | --- | --- |
| U-1 | Cron / Cloudflare Queues 経由の遅延リトライ実装 | 実作業 | Phase 11 既知制限 L-1 / L-2 | UT-09 内で `withRetry` 完了後の継続処理を Cron 次回実行に委譲 | UT-09 |
| U-2 | dead letter → Slack 通知連携 | 実作業 | スコープ外（index.md）| `runWithCompensation` の `recordDeadLetter` フックを Slack Webhook 呼び出しに接続 | UT-07 |
| U-3 | 構造化ログ → メトリクス取り込み | 実作業 | スコープ外（index.md）| Cloudflare Logpush + Grafana で `code` 別エラー率・リトライ率・補償発生率を可視化 | UT-08 |
| U-4 | apps/web 側エラー UI（トースト・モーダル）の実装 | 実作業 | Phase 11 既知制限 L-5 | NON_VISUAL タスク外。`parseApiResponse` の戻り値を UI に接続する別タスクで起票 | 別途起票（UI 実装タスク） |
| U-5 | i18n 対応（エラーメッセージ辞書） | 設計 | Phase 10 MINOR-1 | `UBM_ERROR_CODES[code].defaultDetail` を `Record<Locale, string>` に拡張、`Accept-Language` 解釈追加 | 将来タスク（要件発生時に再評価）|
| U-6 | 認証エラー（401/403）詳細仕様の最終化 | 設計 | index.md スコープ外 | UBM-4001 / UBM-4002 / UBM-4003 のレスポンス body に追加すべき認証情報（WWW-Authenticate ヘッダ等）を確定 | 認証系タスク（02-auth.md / 13-mvp-auth.md と整合）|
| U-7 | ローカル `wrangler dev` と本番 Workers のログ出力差確認 | 運用 | Phase 11 既知制限 L-8 | デプロイ後に `console.error` 経由のログが Cloudflare Logs に正しく流れることを実機確認 | 02-serial-monorepo-runtime-foundation（デプロイ運用 Phase）|
| U-8 | `originalMessage` 値内 Bearer トークン残存の値レベル redact | 設計 | Phase 10 MINOR-2 / Phase 6 security-leak-tests L-1 | sanitize に値レベルパターンマッチ（`Bearer\s+\S+` / `Cookie:\s+\S+`）を追加 | UT-08（モニタリング基盤と合わせて検討）|
| U-9 | vitest 導入と Phase 4/6 設計テストの実装化 | テストインフラ | Phase 11 既知制限 L-9 | `vitest` を devDependency に追加し、`@vitest/coverage-v8` で line/branch カバレッジ計測 | テストインフラ整備タスク（未起票、UT-10 スコープ外）|
| U-10 | `/__debug/throw` エンドポイント（開発用 500 発火）| 開発支援 | Phase 11 既知制限 L-10 | 開発環境のみ `app.get("/__debug/throw", () => { throw new Error("debug") })` を追加 | 任意（U-9 と同時に検討）|
| U-11 | 既存 `/sync/manual` / `/sync/backfill` の problem+json 完全移行 | 実装 | エレガント検証 / API適用範囲再監査 | 既存 worker 戻り値の `500` JSON を標準 `ApiError` throw または `errorHandler` 経由へ統一 | UT-09 |
| U-12 | 値ベース redaction 強化 | セキュリティ | Phase 6 security leak / エレガント検証 | Bearer token / Cookie / API key 風文字列を値内から検出し、ログ集約前に redact | UT-08 |

## 委譲先別サマリー

| 委譲先 | 件数 | 件名 |
| --- | --- | --- |
| UT-07（通知基盤） | 1 | U-2 |
| UT-08（モニタリング） | 2 | U-3, U-8 |
| UT-09（Sheets→D1 同期） | 1 | U-1 |
| 02-serial（runtime foundation） | 1 | U-7 |
| 認証系タスク | 1 | U-6 |
| 別途起票（UI 実装） | 1 | U-4 |
| 将来タスク（要件発生時）| 1 | U-5 |
| テストインフラ整備（未起票） | 2 | U-9, U-10 |
| API標準の下流適用 | 2 | U-11, U-12 |
| **合計** | **12** | – |

## 完了条件

- [x] 5 検出ソースすべて確認済み
- [x] 検出結果（12 件）が委譲先付きで記録
- [x] 0 件でも本ファイルを作成（実際は 12 件検出）
- [x] 推奨対応が各項目に明記
