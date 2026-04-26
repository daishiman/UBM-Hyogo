# UT-10: エラーハンドリング標準化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-10 |
| タスク名 | エラーハンドリング標準化 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1〜2 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |

## 目的

API エラーレスポンス形式・Sheets 同期失敗時のリトライ戦略・D1 書き込み失敗時のロールバック方針を全社的に定義し、開発者がエラー処理実装時に都度判断しなくて済む共通標準を確立する。

## スコープ

### 含む
- API エラーレスポンス形式の標準定義（HTTPステータスコード・エラーコード体系・レスポンスボディ JSON 構造）
- Cloudflare Workers のグローバルエラーハンドラ実装（`apps/api`）
- Google Sheets API 呼び出し失敗時のリトライ戦略（指数バックオフ・最大リトライ回数・タイムアウト設定）
- D1 書き込み失敗時のロールバック方針（トランザクション境界・dead letter 記録）
- エラーログの構造化フォーマット定義（`console.error` に統一するか Workers Analytics Engine を使うか）
- クライアント向けエラーメッセージのガイドライン（i18n 対応方針・機密情報の非開示ルール）
- 標準エラーハンドラの `@repo/shared` パッケージへの配置

### 含まない
- 各タスクの具体的なエラーハンドリング実装（UT-09 等の個別タスクで行う）
- 通知基盤（UT-07）へのエラー通知連携（別タスクで実装）
- モニタリング/アラートとの統合（UT-08 で実装）
- フロントエンド（`apps/web`）側のエラー表示実装

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02-serial-monorepo-runtime-foundation | monorepo 構成・`@repo/shared` パッケージの基盤が確立されていること |
| 上流 | 03-serial-data-source-and-storage-contract | D1・Sheets のデータ操作パターンが固まっており、エラー発生点を特定できること |
| 下流 | UT-09（Sheets→D1 同期ジョブ実装） | 定義したリトライ戦略・ロールバック方針を同期ジョブ実装に適用する |
| 下流 | UT-07（通知基盤設計と導入） | 同期失敗のエラー検知から通知発報までのインターフェース定義に利用する |
| 下流 | UT-08（モニタリング/アラート設計） | 構造化エラーログ形式がメトリクス収集設計の前提になる |

## 着手タイミング

> **最早着手可能**: Wave 1 の中で最も早く着手できる未タスク。`02-serial-monorepo-runtime-foundation` と `03-serial-data-source-and-storage-contract` の設計フェーズ（Phase 2〜3）と並走して定義作業を進めることができる。

| 条件 | 理由 |
| --- | --- |
| 02/03 の設計フェーズ着手後（並走 OK） | エラーレスポンス形式の定義は実装前の設計段階から決められる |
| 実装が固まる前に定義することを推奨 | 後付けで標準化すると既存コードの修正コストが高くなる |

## 苦戦箇所・知見

**エラーコード体系の設計難度**
エラーコードを過剰に細分化するとクライアント側での対応コードが肥大化し、逆に粗すぎると原因特定が困難になる。RFC 7807（Problem Details for HTTP APIs）のフォーマットを参考に `type`・`title`・`status`・`detail`・`instance` の5フィールドを基本とし、アプリ固有コード（例: `UBM-4001`）を `code` として追加する形が汎用性と特定性のバランスが取れやすい。

**D1 のトランザクション制約**
Cloudflare D1 はネストされたトランザクションをサポートしない。また `db.batch()` はアトミックに実行されるが、部分失敗時のロールバックが自動では行われない（失敗したステートメントはスキップされる）。ロールバックが必要なケースでは明示的な補償処理（compensating transaction）を設計する必要がある。この制約を標準ドキュメントに明記しておかないと、実装者が誤った前提で進める危険がある。

**指数バックオフ実装の Workers 制約**
Cloudflare Workers は `setTimeout` が利用できないため（Node.js 互換ではない）、リトライ間の待機に `await new Promise(r => setTimeout(r, ms))` は使えない。Cron ジョブのリトライは「次回 Cron 実行まで待つ」設計（D1 に失敗ステータスを記録し次回 Cron で再処理）とするか、Cloudflare Queues を使った遅延リトライを採用する。この選択を標準として文書化すること。

**エラーメッセージの多言語対応**
バンドマン向けシステムは日本語ユーザー向けだが、将来的な英語対応も考慮する場合、エラーコードとメッセージを分離しておく必要がある。初期は日本語のみで可だが、レスポンスの `message` フィールドとエラーコードを分離する構造は最初から作っておくこと。

**クライアント向けとサーバー向けエラーの混在**
Sheets API の認証失敗（5xx 系）をそのままクライアントに返すと機密情報（スタックトレース等）が漏洩する。サーバー内部エラーは汎用メッセージに変換してクライアントに返し、詳細は構造化ログにのみ記録するルールを標準化する。

## 実行概要

- RFC 7807 準拠のエラーレスポンス型（`ApiError`）を `@repo/shared/src/errors.ts` に定義し、アプリ固有エラーコード体系（`UBM-XXXX`）を設計する
- `apps/api` に `errorHandler` ミドルウェアを実装し、未捕捉例外を構造化エラーレスポンスに変換する（内部詳細はログのみ、クライアントへは汎用メッセージ）
- Sheets API 呼び出し用の `withRetry` 関数を実装し、最大リトライ回数・初期待機時間・バックオフ係数を設定可能にする（Workers の `setTimeout` 制約を考慮し、同期呼び出し内でのリトライは最小限にとどめ、Cron ベースの再処理を主戦略とする）
- D1 書き込みのロールバック方針をドキュメント化し、補償処理パターンのサンプルコードを `@repo/shared/src/db/transaction.ts` に配置する
- エラーハンドリング標準化ドキュメント（`doc/unassigned-task/UT-10-error-handling-standardization.md` 自体および `apps/api/docs/error-handling.md`）を作成し、実装者が参照できる状態にする

## 完了条件

- [ ] `ApiError` 型と UBM エラーコード体系が `@repo/shared` に定義されている
- [ ] `errorHandler` ミドルウェアが `apps/api` に実装され、テストが通過している
- [ ] クライアントへの内部エラー情報漏洩がないことをテストで確認している
- [ ] `withRetry` 関数が実装され、Sheets API 呼び出しで利用されている
- [ ] D1 補償処理パターンのサンプルコードが存在し、UT-09 実装者が参照可能な状態にある
- [ ] エラーハンドリング設計ドキュメント（`error-handling.md`）が作成されている
- [ ] 定義したエラーレスポンス形式が `apps/web` の API クライアントと整合している

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | API スキーマ定義の確認（エラーレスポンス形式との整合） |
| 必須 | doc/01-infrastructure-setup/03-serial-data-source-and-storage-contract/index.md | D1・Sheets のデータ操作パターン確認 |
| 参考 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | UT-10 の原典記録 |
| 参考 | https://www.rfc-editor.org/rfc/rfc7807 | RFC 7807: Problem Details for HTTP APIs |
| 参考 | https://developers.cloudflare.com/d1/platform/client-api/#batch-statements | D1 batch statements の挙動確認 |
