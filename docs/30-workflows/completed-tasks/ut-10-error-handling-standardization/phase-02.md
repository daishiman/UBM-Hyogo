# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-27 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | spec_created |

## 目的

Phase 1 で確定した要件・エラーコード体系枠組み・AC を入力として、`ApiError` 型・エラーコード体系（確定版）・`errorHandler` ミドルウェア・`withRetry` 関数・D1 補償処理パターン・構造化ログフォーマット・クライアント／サーバーエラー分離戦略を確定する。すべての成果物は `@ubm-hyogo/shared` 配置と `apps/api` 実装の両方を意識し、Phase 5 実装の作業をそのまま指示できる粒度まで具体化する。

## 実行タスク

### 1. `ApiError` 型定義（RFC 7807 ベース + UBM 固有 `code`）

- TypeScript インターフェースとして `ApiError` を定義する
- フィールド: `type` (URI), `title` (string), `status` (number), `detail` (string), `instance` (string?), `code` (UBM-Nxxx), `traceId` (string?)
- クライアント返却用と内部ログ用の 2 ビューを区別する
- zod スキーマとの整合性を担保する設計とする

### 2. エラーコード体系設計（確定版）

- 命名規則: `UBM-Nxxx`（N = カテゴリ番号、xxx = 連番、桁固定）
- カテゴリ:
  - `UBM-1xxx`: クライアントエラー（400 系、バリデーション）
  - `UBM-4xxx`: 認証・認可エラー（401 / 403）
  - `UBM-5xxx`: サーバ内部エラー（500 系、D1・内部ロジック）
  - `UBM-6xxx`: 外部統合エラー（502 / 503 / 504、Sheets API・外部依存）
- 主要コードを最小セット（各カテゴリ 3〜5 件）で確定する
- 各コードに `title` / `defaultDetail` / `httpStatus` / `i18nKey` を紐付ける

### 3. `errorHandler` ミドルウェア設計（Hono `onError`）

- Hono の `app.onError((err, c) => ...)` を起点に統一処理する
- 既知の `ApiError` はそのまま整形、未知の例外は `UBM-5000` (internal_unknown) にマップする
- レスポンスは RFC 7807 の `application/problem+json` Content-Type で返却する
- 内部詳細（stack trace / SQL / 外部 API 本文）はログのみ、レスポンスからは strip する
- `traceId` を生成・伝播し、ログとレスポンスで関連付け可能にする

### 4. `withRetry` 関数設計（Workers 制約考慮）

- 主戦略: Cron Triggers / Cloudflare Queues による「次回実行で再処理」方式
- 補助戦略: in-request の bounded retry（最大 2 回・短時間バックオフ・累計 < 1 秒）
- `setTimeout` の代替として `await new Promise(r => setTimeout(r, ms))` は回避し、可能なら微小な待機のみを許容する
- シグネチャ案: `withRetry<T>(fn: () => Promise<T>, opts: { maxAttempts: number; baseDelayMs: number; classify: (e: unknown) => RetryClassification }): Promise<T>`
- リトライ可否の分類: transient (network / 5xx) はリトライ、permanent (400 / 認証) は即失敗
- Sheets API 用のプリセット設定を提供する

### 5. D1 補償処理パターン設計（compensating transaction template）

- ネスト TX 不可・`db.batch()` 部分失敗の自動ロールバック不可を前提
- パターン: 「事前状態スナップショット → 主処理 → 失敗時に逆操作」
- `@ubm-hyogo/shared/src/db/transaction.ts` にテンプレート関数を配置
- dead letter テーブルへの失敗記録を共通化する
- 冪等性（idempotency key）を補償処理の前提条件として明記する

### 6. 構造化ログフォーマット設計

- `console.error` の引数を JSON シリアライズ可能なオブジェクトに統一する
- 必須フィールド: `level` / `timestamp` / `traceId` / `code` / `message` / `context`
- 機密情報（auth トークン・PII）はサニタイズキーリストで自動マスクする
- UT-08 のモニタリング基盤が後段で取り込めるスキーマを意識する

### 7. クライアント向け／サーバー向けエラー分離戦略

- クライアント返却: `code` / `title` / `status` / 安全な `detail` / `traceId`
- サーバーログのみ: stack trace / SQL / 外部 API レスポンス本文 / `cause` チェーン
- ミドルウェアで「ホワイトリスト方式」（ログ用に明示的に拾うフィールドを限定）を採用する
- 例外: 開発環境（`NODE_ENV=development`）ではデバッグ用に内部詳細をレスポンスに含めることを許容するが、staging / production では必ず strip する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-01.md | Phase 1 確定要件 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/index.md | AC・スコープ |
| 必須 | RFC 7807 | レスポンス標準 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | 既存 API 契約 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 制約 |
| 参考 | Hono 公式ドキュメント（onError API） | ミドルウェア設計 |

## 実行手順

### ステップ 1: 型・コード体系の確定

- `ApiError` 型定義を api-error-schema.md に記述する
- エラーコード体系を error-code-taxonomy.md に確定する
- 既存 API（01-api-schema.md）との整合を確認する

### ステップ 2: ミドルウェア・リトライ・補償の設計

- `errorHandler` の処理フロー（既知例外分岐・未知例外マッピング・レスポンス整形・ログ出力・traceId 伝播）を Mermaid 図で記述する
- `withRetry` のリトライ判定ロジック・Cron / Queues 連携の設計を記述する
- D1 補償処理パターンの具体例（複数行 INSERT 失敗時の逆 DELETE）を記述する

### ステップ 3: ログ・分離戦略の確定

- 構造化ログのスキーマ・サニタイズ対象キーリストを確定する
- クライアント／サーバー分離のホワイトリスト一覧を確定する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 本 Phase の設計を設計レビューの入力にする |
| Phase 5 | 設計をそのまま実装手順として参照する |
| Phase 6 | 漏洩なしテストの観点を引き継ぐ |
| Phase 7 | AC との完全トレース表を作成する |

## 多角的チェック観点（AIが判断）

- 価値性: 設計が AC-1〜AC-7 を直接実装に変換できる粒度になっているか
- 実現性: Workers 制約（`setTimeout` 不可・ネスト TX 不可）に整合しているか
- 整合性: RFC 7807 と既存 API スキーマの両方と矛盾しないか
- 運用性: ミドルウェアでの自動サニタイズが「コードレビューで強制」できる構造になっているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ApiError 型定義 | 2 | spec_created | RFC 7807 + UBM 固有 code |
| 2 | エラーコード体系確定 | 2 | spec_created | 4 大区分・最小セット |
| 3 | errorHandler ミドルウェア設計 | 2 | spec_created | Hono onError ベース |
| 4 | withRetry 関数設計 | 2 | spec_created | Cron / Queues 主戦略 |
| 5 | D1 補償処理パターン設計 | 2 | spec_created | compensating transaction |
| 6 | 構造化ログ設計 | 2 | spec_created | サニタイズキーリスト含む |
| 7 | クライアント／サーバー分離戦略 | 2 | spec_created | ホワイトリスト方式 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/api-error-schema.md | `ApiError` 型・RFC 7807 拡張 |
| ドキュメント | outputs/phase-02/error-code-taxonomy.md | エラーコード体系（確定版） |
| ドキュメント | outputs/phase-02/error-handler-middleware-design.md | `errorHandler` 設計（Mermaid 図含む） |
| ドキュメント | outputs/phase-02/retry-strategy-design.md | `withRetry` / Cron / Queues 設計 |
| ドキュメント | outputs/phase-02/d1-compensation-pattern.md | D1 補償処理パターン |
| ドキュメント | outputs/phase-02/structured-log-format.md | 構造化ログフォーマット |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 4 条件評価

| 条件 | 評価方針 |
| --- | --- |
| 価値性 | 設計が下流タスクの実装コストを削減するか（共通化の網羅性） |
| 実現性 | Workers 制約下で全設計要素が動作可能か |
| 整合性 | RFC 7807 / 既存 API / 認証仕様との矛盾なし |
| 運用性 | 機密情報非開示がミドルウェアで自動強制できるか |

## 完了条件

- [ ] `ApiError` 型定義が確定している
- [ ] エラーコード体系（最小セット含む）が確定している
- [ ] `errorHandler` ミドルウェアの処理フローが Mermaid で図示されている
- [ ] `withRetry` 関数のシグネチャと判定ロジックが確定している
- [ ] D1 補償処理パターンの具体例が記載されている
- [ ] 構造化ログのスキーマ・サニタイズキーリストが確定している
- [ ] クライアント／サーバー分離のホワイトリスト一覧が確定している

## タスク100%実行確認【必須】

- 全設計タスクが spec_created
- 全成果物が指定パスに配置済み
- Workers 制約（`setTimeout` 不可・ネスト TX 不可）に整合している
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: 6 種の設計成果物（api-error-schema / taxonomy / middleware / retry / d1-compensation / log）を Phase 3 に渡す
- ブロック条件: 主要 6 成果物のいずれかが未作成なら次 Phase に進まない
