# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-27 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | spec_created |

## 目的

Phase 2 の 6 種設計成果物（`ApiError` 型 / エラーコード体系 / `errorHandler` ミドルウェア / `withRetry` / D1 補償処理 / 構造化ログ）の妥当性をレビューし、RFC 7807 準拠性・Workers 制約整合・`@ubm-hyogo/shared` 配置妥当性・UT-09 / UT-07 / UT-08 への引き継ぎ容易性・機密情報非開示の 5 観点で PASS / MINOR / MAJOR 判定を行い、GO / NO-GO ゲート判定を確定する。

## 実行タスク

### 1. RFC 7807 準拠性

- `type` / `title` / `status` / `detail` / `instance` の 5 フィールドが正しく扱われているか
- Content-Type が `application/problem+json` で返却される設計になっているか
- UBM 固有 `code` が拡張として整合しているか（標準フィールドを上書きしていないか）

### 2. Workers 制約整合

- `setTimeout` を用いた長時間ウェイトに依存していないか
- ネスト TX 不可・`db.batch()` 部分失敗の前提が補償処理パターンに反映されているか
- request lifetime（CPU 制限）内で完結する設計か
- Cron / Queues の利用判断が無料枠制約と整合しているか

### 3. `@ubm-hyogo/shared` 配置妥当性

- 配置候補（`@ubm-hyogo/shared/src/errors/` / `db/transaction.ts` / `logging/`）が Workspace 構造と整合しているか
- `apps/api` 専用の依存（Hono 等）を `@ubm-hyogo/shared` に持ち込んでいないか
- 型のみ・純粋関数のみが `@ubm-hyogo/shared` に置かれ、副作用は `apps/api` 側にあるか

### 4. UT-09 / UT-07 / UT-08 への引き継ぎ容易性

- UT-09（Sheets→D1 同期）が `withRetry` と D1 補償処理パターンを直接利用できる API になっているか
- UT-07（通知）が dead letter 記録 / 構造化ログをフックとして利用できる構造か
- UT-08（モニタリング）が構造化ログのスキーマを取り込めるか

### 5. 機密情報非開示

- ホワイトリスト方式が漏洩リスクを最小化しているか
- 開発環境の例外（内部詳細をレスポンスに含める）が staging / production で確実に無効化される設計か
- サニタイズキーリストが PII / 認証トークンを網羅しているか

## レビューチェックリスト

- [ ] `ApiError` 型が RFC 7807 の 5 フィールドを保持し、`code` 拡張が衝突していない
- [ ] エラーコード体系の 4 大区分が網羅的で、HTTP ステータスコードと対応が取れている
- [ ] `errorHandler` ミドルウェアが既知 / 未知例外を分岐し、内部詳細を strip する設計
- [ ] `withRetry` が Cron / Queues 主戦略・in-request bounded retry 補助の二段構成
- [ ] D1 補償処理が冪等性キーと dead letter 記録を含む
- [ ] 構造化ログのサニタイズキーリストが PII・認証情報を網羅
- [ ] クライアント／サーバー分離がホワイトリスト方式で強制される
- [ ] `@ubm-hyogo/shared` 配置が Hono 依存を持ち込まない
- [ ] UT-09 / UT-07 / UT-08 が利用するフックポイントが明示されている
- [ ] 開発環境例外が staging / production で無効化される

## レビュー観点

Phase 1 の `outputs/phase-01/requirements.md` / `outputs/phase-01/error-code-taxonomy-draft.md` と Phase 2 の設計成果物を入力に、上記チェックリストを PASS / MINOR / MAJOR で判定する。

## GO / NO-GO 判定基準

| 判定 | 条件 | 次 Phase |
| --- | --- | --- |
| GO | 全観点 PASS、または MINOR のみで Phase 5 までに解消可能 | Phase 4 へ進む |
| CONDITIONAL GO | MINOR が複数あり Phase 4 開始までに解消が必要 | MINOR 解消後 Phase 4 へ |
| NO-GO | MAJOR が 1 件以上ある | Phase 2 に差し戻し |

## 4 条件評価結果

| 条件 | 判定方針 | 想定結果 |
| --- | --- | --- |
| 価値性 | 共通標準が下流タスクの実装コスト削減に寄与 | PASS 想定 |
| 実現性 | Workers 制約下で全要素が動作可能 | PASS 想定（Phase 2 で考慮済み） |
| 整合性 | RFC 7807 / 既存 API / 認証仕様と矛盾なし | PASS 想定 |
| 運用性 | 機密情報非開示がミドルウェアで自動強制 | PASS 想定 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-01.md | AC・4 条件評価基準 |
| 必須 | RFC 7807 | 標準準拠性確認 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | 既存 API 整合確認 |

## 実行手順

### ステップ 1: 設計成果物の精査

- Phase 2 の 6 種成果物をすべて読み、レビューチェックリストの 10 項目を 1 件ずつ判定する
- 各項目に PASS / MINOR / MAJOR を付ける

### ステップ 2: 代替案検討

- エラーレスポンス標準: RFC 7807 採用 vs 独自スキーマ
- リトライ戦略: Cron 主戦略 vs Queues 主戦略 vs in-request バックオフ
- D1 補償処理: compensating transaction vs 冪等性キー再実行

### ステップ 3: GO / NO-GO 判定

- レビュー結果を design-review-report.md に記録する
- gate-decision.md に GO / CONDITIONAL GO / NO-GO の判定理由を記録する
- MAJOR がある場合は Phase 2 に差し戻し、解消後に再レビューする

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | NO-GO 判定時に差し戻す |
| Phase 4 | GO 判定後に事前検証手順設計に進む |
| Phase 5 | レビュー結果を実装の根拠とする |

## 多角的チェック観点（AIが判断）

- 価値性: レビューが下流タスク利用容易性を実際に評価しているか
- 実現性: Workers 制約逸脱を確実に検出できる観点になっているか
- 整合性: RFC 7807 と既存 API の両方を確認しているか
- 運用性: 機密情報漏洩リスクを判定基準に含めているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | RFC 7807 準拠性レビュー | 3 | spec_created | api-error-schema 対象 |
| 2 | Workers 制約整合レビュー | 3 | spec_created | retry / d1-compensation 対象 |
| 3 | `@ubm-hyogo/shared` 配置妥当性レビュー | 3 | spec_created | 全成果物対象 |
| 4 | 下流タスク引き継ぎ容易性レビュー | 3 | spec_created | UT-09 / UT-07 / UT-08 視点 |
| 5 | 機密情報非開示レビュー | 3 | spec_created | log / middleware 対象 |
| 6 | 代替案検討 | 3 | spec_created | 3 領域 |
| 7 | GO / NO-GO 判定 | 3 | spec_created | gate-decision.md に記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review-report.md | 設計レビュー結果（10 項目判定 + 代替案） |
| ドキュメント | outputs/phase-03/gate-decision.md | GO / NO-GO 判定 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] レビューチェックリスト 10 項目すべての判定が完了している
- [ ] 代替案検討が 3 領域（レスポンス標準 / リトライ戦略 / 補償処理）で実施されている
- [ ] GO / CONDITIONAL GO / NO-GO 判定が確定している
- [ ] MAJOR がない（または Phase 2 差し戻し記録がある）
- [ ] 4 条件評価結果が記録されている

## タスク100%実行確認【必須】

- 全レビュータスクが spec_created
- 全成果物が指定パスに配置済み
- MAJOR 判定の場合は Phase 2 差し戻し記録がある
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 4 (事前検証手順)
- 引き継ぎ事項: design-review-report.md / gate-decision.md と GO 判定根拠を Phase 4 に渡す
- ブロック条件: NO-GO 判定（MAJOR 残存）の場合は Phase 4 に進まない
