# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-27 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | spec_created |

## 目的

Phase 1〜9 の成果物を総合的に評価し、AC-1〜AC-7 のトレース・RFC 7807 準拠性・Workers 制約整合・機密情報非開示・下流タスク引き継ぎ容易性・i18n 拡張容易性・実装と仕様の整合の 7 観点で最終評価を行い、GO / CONDITIONAL GO / NO-GO の blocker 判定を確定する。MINOR 指摘は「機能影響なし」を理由に未タスク化しないこと（[Phase 12 漏れ防止] 準拠）。

## 実行タスク

- Task 10-1: AC-1〜AC-7 の根拠成果物を全件トレースする
- Task 10-2: Phase 9 の品質ゲート結果を確認し、blocker を分類する
- Task 10-3: RFC 7807 / Workers 制約 / 機密情報非開示 / 下流タスク引き継ぎの最終整合を確認する
- Task 10-4: MINOR 指摘を Phase 12 の未タスク検出へ渡す
- Task 10-5: GO / CONDITIONAL GO / NO-GO 判定を確定する

## レビュー対象（acceptance criteria AC-1〜AC-7 のトレース）

| AC | 内容 | 根拠 Phase / 成果物 | 判定方法 |
| --- | --- | --- | --- |
| AC-1 | `ApiError` 型・UBM エラーコード体系（UBM-1xxx/4xxx/5xxx/6xxx）が `@ubm-hyogo/shared` に定義 | Phase 5 実装 / Phase 8 リファクタ / `packages/shared/src/errors.ts` | ファイル存在 + 型 export + subpath export 確認 |
| AC-2 | `errorHandler` ミドルウェアが `apps/api` に実装、テスト通過 | Phase 5 / Phase 6 / `apps/api/src/middleware/error-handler.ts` | ユニットテスト GREEN |
| AC-3 | クライアント機密情報漏洩なしをテストで確認（4xx/5xx にスタックトレース・DB 文字列・トークンが含まれない） | Phase 6 異常系テスト / Phase 9 test ゲート | 異常系テスト GREEN |
| AC-4 | `withRetry` が Sheets API で利用 | Phase 5 / `packages/shared/src/retry.ts` + Sheets クライアント配線 | 配線確認 + ユニットテスト GREEN |
| AC-5 | D1 補償処理サンプル配置 | Phase 5 / `packages/shared/src/db/transaction.ts` | サンプル + ユニットテスト GREEN |
| AC-6 | `error-handling.md` 設計ドキュメント完成 | Phase 2 / Phase 5 / `apps/api/docs/error-handling.md` | 必須セクション網羅 + link 検証 PASS |
| AC-7 | `apps/web` API クライアントと整合（ApiError 型共有） | Phase 8 / `apps/web/app/lib/api-client.ts` | 契約テスト GREEN + 型同期確認 |

## レビュー観点【必須】

### 1. RFC 7807 準拠性

- `type` / `title` / `status` / `detail` / `instance` の 5 フィールドが正しく出力されているか
- Content-Type が `application/problem+json` で返却されているか
- UBM 固有 `code` が拡張として整合しているか（標準フィールドを上書きしていないか）
- 判定: PASS / MINOR / MAJOR

### 2. Workers 制約整合

- `setTimeout` を用いた長時間ウェイトに依存していないか
- request lifetime（CPU 制限）内で全処理が完結しているか
- ネスト TX 不可・`db.batch()` 部分失敗の前提が補償処理に反映されているか
- 判定: PASS / MINOR / MAJOR

### 3. 機密情報非開示

- 4xx/5xx レスポンス body にスタックトレースが含まれていないか
- DB 接続文字列・SQL 文・D1 binding 名が含まれていないか
- 認証トークン・API キー・PII が含まれていないか
- 開発環境例外が staging / production で確実に無効化されているか
- 判定: PASS / MINOR / MAJOR（MAJOR は即 NO-GO）

### 4. 下流タスク（UT-09 / UT-07 / UT-08）への引き継ぎ容易性

- UT-09（Sheets→D1 同期）が `withRetry` と D1 補償処理を直接利用できるか
- UT-07（通知）が dead letter 記録 / 構造化ログをフックとして利用できるか
- UT-08（モニタリング）が構造化ログのスキーマを取り込めるか
- 判定: PASS / MINOR / MAJOR

### 5. i18n 拡張容易性（code/message 分離維持）

- エラーコード（`UBM-Nxxx`）とメッセージ文字列が分離されているか
- メッセージカタログを後付けで追加できる構造か（`code → message` lookup を 1 箇所に集約）
- `title` / `detail` の locale 切り替えが将来追加可能か
- 判定: PASS / MINOR / MAJOR

### 6. 実装と仕様の整合（apps/web ApiError 型共有が機能する）

- `apps/web/app/lib/api-client.ts` が `@ubm-hyogo/shared/errors` の `ApiError` を import しているか
- 契約テスト（zod / type-level）で shape 一致を確認しているか
- subpath export と consumer 側 import が一致しているか（Phase 9 mirror parity 結果を参照）
- 判定: PASS / MINOR / MAJOR

### 7. 設計ドキュメントの網羅性

- `apps/api/docs/error-handling.md` が必須セクション（エラー体系 / レスポンス形式 / リトライ戦略 / 補償処理 / ログ / クライアント開示ガイド）を網羅しているか
- 判定: PASS / MINOR / MAJOR

## blocker 判定（GO / CONDITIONAL GO / NO-GO）【必須】

| 判定 | 条件 | 次 Phase |
| --- | --- | --- |
| GO | 全 7 観点 PASS、または MINOR のみで Phase 11 までに解消可能 | Phase 11 へ進む |
| CONDITIONAL GO | MINOR が複数あり Phase 11 開始までに解消必要、または MAJOR が機密情報非開示以外で 1 件 | MINOR/MAJOR 解消後 Phase 11 へ |
| NO-GO | 機密情報非開示で MAJOR が 1 件以上、または AC 未達が 1 件以上 | 該当 Phase に差し戻し |

> 機密情報非開示の MAJOR は即 NO-GO とし、staging / production への展開を絶対に許可しない。

## MINOR 指摘の未タスク化方針【必須】（[Phase 12 漏れ防止] 準拠）

- 「機能影響なし」は MINOR を未タスク化する理由にならない
- 全 MINOR は `minor-issues-list.md` に記録し、以下のいずれかを必ず付与する:
  1. Phase 11/12/13 のいずれかで対応する（ID 付きで明示）
  2. 別タスクに切り出す（Issue 番号と切り出し理由を記録）
  3. 意図的に対応見送り（理由・影響範囲・再評価時期を記録）
- 「対応見送り」を選ぶ場合でも、ドキュメント上に必ず痕跡を残す

## 4 条件最終評価

| 条件 | 評価観点 | 根拠 Phase | 判定方針 |
| --- | --- | --- | --- |
| 価値性 | 共通標準が UT-09 / UT-07 / UT-08 の実装コストを下げているか | Phase 1, 2, 5 | PASS 想定 |
| 実現性 | Workers 制約下で全 AC を達成しているか | Phase 5, 6, 9 | PASS 想定 |
| 整合性 | RFC 7807 / 既存 API スキーマ / 認証仕様と矛盾しないか | Phase 2, 3, 8 | PASS 想定 |
| 運用性 | 機密情報非開示がミドルウェアで自動強制されているか | Phase 5, 6, 9 | PASS 想定 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-07.md | AC matrix |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-09/quality-report.md | 6 ゲート結果 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-08/refactor-decision-table.md | リファクタ結果 |
| 必須 | apps/api/docs/error-handling.md | 設計ドキュメント |
| 参考 | RFC 7807 Problem Details for HTTP APIs | 標準準拠性確認 |
| 参考 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/phase-10.md | 雛形 |

## 実行手順

### ステップ 1: AC-1〜AC-7 のトレース

- AC ごとに根拠 Phase / 成果物 / 判定方法を `ac-traceability-matrix.md` に記録する
- 全 AC の証跡が揃っているか確認する

### ステップ 2: 7 観点レビュー

- RFC 7807 準拠性 / Workers 制約 / 機密情報非開示 / 下流引き継ぎ / i18n / 実装仕様整合 / 設計ドキュメント網羅性の 7 観点を 1 件ずつ判定する
- 各観点に PASS / MINOR / MAJOR を付与し、`final-review-report.md` に記録する

### ステップ 3: blocker 判定と MINOR 未タスク化方針適用

- 7 観点の判定結果を集約し、GO / CONDITIONAL GO / NO-GO を確定する
- 全 MINOR を `minor-issues-list.md` に記録し、対応 Phase / 別タスク化 / 見送りのいずれかを必ず付与する
- NO-GO の場合は対応 Phase を特定し差し戻す

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 1〜9 | 全成果物を最終評価の根拠として使用 |
| Phase 11 | GO 判定後に手動 smoke test を実施 |
| Phase 12 | GO 判定の結果と MINOR リストを close-out に記録 |

## 多角的チェック観点（AIが判断）

- 価値性: AC-1〜AC-7 が下流タスクの実装で実際に活用可能な形で完成しているか
- 実現性: Workers 制約 / 無料枠制約に違反していないか
- 整合性: apps/web と apps/api の ApiError 型が同一定義を参照しているか
- 運用性: 機密情報非開示が「ミドルウェア自動 + コードレビュー強制 + テスト網羅」の三層で担保されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-7 トレース | 10 | spec_created | ac-traceability-matrix.md |
| 2 | RFC 7807 準拠性レビュー | 10 | spec_created | 観点 1 |
| 3 | Workers 制約レビュー | 10 | spec_created | 観点 2 |
| 4 | 機密情報非開示レビュー | 10 | spec_created | 観点 3（MAJOR 即 NO-GO） |
| 5 | 下流引き継ぎ容易性レビュー | 10 | spec_created | 観点 4 |
| 6 | i18n 拡張容易性レビュー | 10 | spec_created | 観点 5 |
| 7 | 実装仕様整合レビュー | 10 | spec_created | 観点 6 |
| 8 | 設計ドキュメント網羅性レビュー | 10 | spec_created | 観点 7 |
| 9 | blocker 判定 | 10 | spec_created | GO / CONDITIONAL GO / NO-GO |
| 10 | MINOR リスト作成 | 10 | spec_created | minor-issues-list.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/final-review-report.md | 7 観点レビュー結果と blocker 判定 |
| ドキュメント | outputs/phase-10/ac-traceability-matrix.md | AC-1〜AC-7 トレース表 |
| ドキュメント | outputs/phase-10/minor-issues-list.md | MINOR 指摘一覧と対応方針 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] AC-1〜AC-7 のトレースが全件完了している
- [ ] 7 観点レビューが全件 PASS / MINOR / MAJOR で判定されている
- [ ] blocker 判定（GO / CONDITIONAL GO / NO-GO）が確定している
- [ ] 機密情報非開示が PASS（または MAJOR の場合は即 NO-GO で差し戻し記録）
- [ ] 全 MINOR が対応 Phase / 別タスク化 / 見送りのいずれかで処置されている
- [ ] 4 条件最終評価が全件 PASS で記録されている

## タスク100%実行確認【必須】

- 全実行タスクが spec_created
- 全成果物が指定パスに配置済み
- 異常系（NO-GO 判定 / 機密情報漏洩 MAJOR）の差し戻しフローも記述
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 11 (手動 smoke test)
- 引き継ぎ事項: final-review-report.md / ac-traceability-matrix.md / minor-issues-list.md と GO 判定根拠を Phase 11 に引き継ぐ
- ブロック条件: NO-GO 判定（機密情報漏洩 MAJOR / AC 未達）の場合は Phase 11 に進まない
