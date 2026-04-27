# ut-10-error-handling-standardization - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-10 |
| タスク名 | エラーハンドリング標準化 |
| ディレクトリ | docs/30-workflows/ut-10-error-handling-standardization |
| Wave | 1 |
| 優先度 | MEDIUM |
| 作成日 | 2026-04-27 |
| 状態 | phase13_blocked |
| タスク種別 | implementation（コード実装済み、Phase 13 はユーザー承認待ち） |
| GitHub Issue | #12 |

## 目的

UBM 兵庫支部会メンバーサイトにおいて、API エラーレスポンス形式・Sheets 同期失敗時のリトライ戦略・D1 書き込み失敗時のロールバック方針を全社的（プロジェクト全体）に定義し、開発者がエラー処理実装時に都度判断しなくて済む共通標準を確立する。`@ubm-hyogo/shared` への共通基盤配置と `apps/api` のグローバルエラーハンドラ実装を通じて、UT-09（Sheets→D1 同期）・UT-07（通知）・UT-08（モニタリング）を含む下流タスクが一貫したエラー扱いで実装できる土台を整える。

## スコープ

### 含む

- API エラーレスポンス形式の標準定義（HTTP ステータスコード・エラーコード体系・レスポンスボディ JSON 構造）
- Cloudflare Workers のグローバルエラーハンドラ実装（`apps/api`、Hono `onError` ベース）
- Google Sheets API 呼び出し失敗時のリトライ戦略（指数バックオフ・最大リトライ回数・タイムアウト設定）
- D1 書き込み失敗時のロールバック方針（トランザクション境界・dead letter 記録・compensating transaction）
- エラーログの構造化フォーマット定義（`console.error` JSON 構造）
- クライアント向けエラーメッセージのガイドライン（i18n 対応方針・機密情報の非開示ルール）
- 標準エラーハンドラ・`ApiError` 型・`withRetry` 関数等の `@ubm-hyogo/shared` パッケージへの配置

### 含まない

- 各タスクの具体的なエラーハンドリング実装（UT-09 等の業務ロジック側）
- 通知基盤との連携実装（UT-07 が担当）
- モニタリング/アラートとの統合（UT-08 が担当）
- フロントエンド（`apps/web`）側のエラー画面・トースト UI 実装
- 認証エラー（401/403）詳細仕様の確定（02-auth.md / 13-mvp-auth.md 側で確定済み内容を参照するのみ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02-serial-monorepo-runtime-foundation | `@ubm-hyogo/shared` パッケージと `apps/api` の Hono ランタイムが先に存在する必要がある |
| 上流 | 03-serial-data-source-and-storage-contract | D1 / Sheets の I/O 契約が確定していないとロールバック境界が定義できない |
| 下流 | UT-09（Sheets→D1 同期ジョブ実装） | 本タスクの `withRetry` / 補償処理パターンを利用する |
| 下流 | UT-07（通知基盤） | dead letter 記録と通知連携のフックポイントを利用する |
| 下流 | UT-08（モニタリング） | 構造化ログフォーマットを取り込み、メトリクス基盤に流す |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/00-overview.md | システム全体構成 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | API 契約・レスポンスポリシー |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | 認証エラーの位置付け |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 制約（ネスト TX 不可・batch 部分失敗） |
| 必須 | RFC 7807 Problem Details for HTTP APIs | エラーレスポンス標準 |
| 参考 | .claude/skills/aiworkflow-requirements/ | ランタイム/ストレージ正本仕様 |
| 参考 | .claude/skills/task-specification-creator/ | Phase 構造の正本 |

## 受入条件 (AC)

- AC-1: `ApiError` 型と UBM エラーコード体系（`UBM-1xxx` / `UBM-4xxx` / `UBM-5xxx` / `UBM-6xxx` 等）が `@ubm-hyogo/shared` に定義されている
- AC-2: Hono `onError` ベースの `errorHandler` ミドルウェアが `apps/api` に実装され、ユニットテストが通過している
- AC-3: クライアントへの内部エラー（stack trace・SQL 文・外部 API レスポンス本文等）漏洩がないことをテストで確認している
- AC-4: `withRetry` 関数が定義され、Sheets API 呼び出しで利用される設計になっている（in-request リトライは最小化、Cron / Cloudflare Queues による「次回実行で再処理」が主戦略）
- AC-5: D1 補償処理パターン（compensating transaction template）のサンプルが `@ubm-hyogo/shared/src/db/transaction.ts` に配置されている
- AC-6: エラーハンドリング設計ドキュメント（`apps/api/docs/error-handling.md`）が作成され、開発者が参照可能
- AC-7: エラーレスポンス形式が `apps/web` API クライアントの想定型と整合し、契約テストで確認されている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01 |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02 |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03 |
| 4 | 事前検証手順 | phase-04.md | completed | outputs/phase-04 |
| 5 | 実装 | phase-05.md | completed | outputs/phase-05 |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06 |
| 7 | 検証項目網羅性 | phase-07.md | completed | outputs/phase-07 |
| 8 | DRY / 設定整理 | phase-08.md | completed | outputs/phase-08 |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09 |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10 |
| 11 | 手動 smoke test | phase-11.md | completed | outputs/phase-11 |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12 |
| 13 | PR 作成 | phase-13.md | pending_user_approval | outputs/phase-13 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義の主成果物 |
| ドキュメント | outputs/phase-01/error-code-taxonomy-draft.md | エラーコード体系のドラフト |
| ドキュメント | outputs/phase-02/api-error-schema.md | `ApiError` 型・RFC 7807 ベース構造 |
| ドキュメント | outputs/phase-02/error-code-taxonomy.md | エラーコード体系（確定版） |
| ドキュメント | outputs/phase-02/error-handler-middleware-design.md | `errorHandler` ミドルウェア設計 |
| ドキュメント | outputs/phase-02/retry-strategy-design.md | `withRetry` / Cron / Queues 設計 |
| ドキュメント | outputs/phase-02/d1-compensation-pattern.md | D1 補償処理パターン |
| ドキュメント | outputs/phase-02/structured-log-format.md | 構造化ログフォーマット |
| ドキュメント | outputs/phase-03/design-review-report.md | 設計レビュー結果 |
| ドキュメント | outputs/phase-03/gate-decision.md | GO / NO-GO 判定 |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers | API ランタイム / グローバルエラーハンドラ | 無料枠 |
| Cloudflare D1 | DB（補償処理対象） | 無料枠 |
| Cloudflare Cron Triggers | 「次回実行で再処理」リトライ機構 | 無料枠 |
| Cloudflare Queues | 遅延リトライ（採用検討） | 有償の可能性あり（Phase 2 で判定） |
| Google Sheets API | 外部依存（リトライ対象） | 無料枠 |
| RFC 7807 | エラーレスポンス標準 | 標準仕様（コストなし） |

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC-1〜AC-7 が Phase 7 / 10 で完全トレースされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が全 PASS
- 機密情報非開示ルールが Phase 6（異常系検証）で実証されている
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦箇所・知見

**1. エラーコード体系の設計難度**
RFC 7807（Problem Details for HTTP APIs）の `type` / `title` / `status` / `detail` / `instance` 5 フィールドを基本構造とし、UBM アプリ固有コード（例: `UBM-4001`）を独自 `code` フィールドとして追加する。これにより HTTP 標準互換性とアプリ固有の識別性を両立する。

**2. D1 のトランザクション制約**
Cloudflare D1 はネスト TX 非サポートかつ `db.batch()` の部分失敗に対する自動ロールバックがない。複数ステップの書き込みは明示的な compensating transaction（事前状態を保存し、失敗時に逆操作で復元）パターンで補う必要がある。

**3. 指数バックオフ実装の Workers 制約**
Workers 環境では `setTimeout` による長時間ウェイトが許容されない。Cron による「次回実行で再処理」または Cloudflare Queues の遅延リトライを主戦略とし、in-request の即時リトライは「短時間の bounded retry」に限定する。

**4. エラーメッセージの多言語対応**
MVP 段階は日本語のみ提供だが、`code`（機械可読）と `message`（人間可読）を最初から分離した構造を採用し、将来の i18n 拡張時にメッセージ辞書を差し替えるだけで対応できるようにする。

**5. クライアント向けとサーバー向けエラーの混在**
内部詳細（stack trace、SQL 文、外部 API のレスポンス本文、認証情報の片鱗等）はサーバーログのみに記録し、クライアントには汎用的な `code` / `title` / 安全な `detail` のみ返す。`errorHandler` ミドルウェアでこの分離を強制する。

## 関連リンク

- 上位 README: ../README.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/12
