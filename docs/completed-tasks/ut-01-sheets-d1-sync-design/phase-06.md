# Phase 6: 異常系・エラーケース検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| タスク種別 | docs-only（設計文書作成のみ。コード・テスト実装なし） |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系・エラーケース検証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (設計文書作成実行) |
| 次 Phase | 7 (検証項目網羅性確認) |
| 状態 | completed |

## 目的

設計文書のエラーハンドリング設計を検証する。
部分失敗シナリオのフロー・quota 超過時の対処・冪等性確保の設計が、実際の運用で問題なく機能するかを文書レベルで検証する。

## 実行タスク

- 部分失敗シナリオ（一部行の同期失敗）のフロー検証
- Google Sheets API quota 超過時の対処フロー確認
- D1 書き込み失敗時のロールバック・リトライフロー確認
- 冪等性確保の設計検証（重複実行時の安全性）
- sync_audit の error_reason 記録方針の確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/sequence-diagrams.md | 異常系フロー図 |
| 必須 | outputs/phase-05/retry-policy.md | リトライポリシー |
| 必須 | outputs/phase-05/sync-audit-contract.md | sync_audit スキーマ（error_reason 等） |
| 必須 | outputs/phase-01/requirements.md | 受入条件（AC-3〜AC-5 が異常系関連） |

## 実行手順

### ステップ 1: 部分失敗シナリオのフロー検証

- Phase 5 の sequence-diagrams.md を読み、部分失敗時（例: 100行中5行の書き込み失敗）のフローが明記されているか確認する。
- 失敗行を sync_audit に記録し、成功行はコミットする設計になっているか確認する。
- 曖昧な箇所をリストアップして error-case-verification.md に記録する。

### ステップ 2: quota 超過時の対処フロー確認

- Google Sheets API の quota（読み取り回数制限）を超過した場合に、処理を安全に中断・記録する設計になっているか確認する。
- retry-policy.md の quota 超過対応が sequence-diagrams.md の異常系フローと整合しているか確認する。

### ステップ 3: 冪等性確保の設計検証

- sync_audit の冪等キー設計が重複実行を防ぐ仕組みとして十分か確認する。
- 同一データを 2 回同期した場合に D1 のデータが破損しないフローを検証する。

### ステップ 4: 検証結果の記録と handoff 確認

- 検証で発見した設計上の問題点・open question を error-case-verification.md に記録する。
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase（検証項目網羅性確認）に渡す blocker を明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 本 Phase の検証結果を AC トレースの入力として使用 |
| Phase 8 | 設計文書の修正箇所の特定に使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 異常系設計が運用担当者の障害対応コストを下げるか。
- 実現性: 部分失敗・quota 超過が D1 / Sheets の実制約内で処理可能か。
- 整合性: リトライポリシーとシーケンス図の異常系フローが一致しているか。
- 運用性: sync_audit から障害原因を追跡・復旧できる設計になっているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 部分失敗シナリオのフロー検証 | 6 | completed | sequence-diagrams.md を参照 |
| 2 | quota 超過時の対処フロー確認 | 6 | completed | retry-policy.md と整合確認 |
| 3 | 冪等性確保の設計検証 | 6 | completed | sync-audit-contract.md を参照 |
| 4 | 検証結果の記録 | 6 | completed | outputs/phase-06/error-case-verification.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/error-case-verification.md | 異常系・エラーケース検証レポート |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- `outputs/phase-06/error-case-verification.md` が作成済み
- 部分失敗・quota 超過・冪等性の 3 シナリオが検証されている
- 設計文書の修正が必要な箇所がリストアップされている（または問題なしが明記）
- Phase 7 への handoff 事項が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 設計文書の修正箇所が明確に記録されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 7 (検証項目網羅性確認)
- 引き継ぎ事項: error-case-verification.md の検証結果を AC-3〜AC-5 のトレースに使用する。
- ブロック条件: `error-case-verification.md` が未作成なら次 Phase に進まない。

## エラーケース一覧（検証対象）

| # | シナリオ | 期待動作 | 検証対象資料 |
| --- | --- | --- | --- |
| E-01 | 一部行の D1 書き込み失敗 | 失敗行を sync_audit に記録、成功行はコミット | sequence-diagrams.md |
| E-02 | Sheets API quota 超過 | 処理中断・sync_audit に記録・次回ジョブで再試行 | retry-policy.md |
| E-03 | 同一データの重複同期 | 冪等キーで重複をスキップ、D1 データ不変 | sync-audit-contract.md |
| E-04 | ネットワーク障害による途中切断 | タイムアウト後にリトライ、部分コミットなし | sequence-diagrams.md |
| E-05 | D1 接続失敗 | Worker がエラーを返し、sync_audit に記録 | sequence-diagrams.md |
