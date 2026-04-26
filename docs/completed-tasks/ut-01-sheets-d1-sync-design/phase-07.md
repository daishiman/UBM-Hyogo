# Phase 7: 検証項目網羅性確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| タスク種別 | docs-only（設計文書作成のみ。コード・テスト実装なし） |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性確認 |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系・エラーケース検証) |
| 次 Phase | 8 (文書DRY化・整合性整理) |
| 状態 | completed |

## 目的

受入条件（AC-1〜AC-7）がすべて設計文書でカバーされているかを確認する。
トレーサビリティマトリクスを作成し、設計文書と受入条件の対応関係を可視化する。

## 実行タスク

- 受入条件（AC-1〜AC-7）の一覧確認
- 各 AC と設計文書（Phase 5 成果物）の対応関係のマッピング
- カバーされていない AC の特定と対処方針の決定
- AC トレースマトリクスの作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/requirements.md | 受入条件（AC-1〜AC-7）の正本 |
| 必須 | outputs/phase-05/sync-method-comparison.md | AC との対応確認 |
| 必須 | outputs/phase-05/sequence-diagrams.md | AC との対応確認 |
| 必須 | outputs/phase-05/sync-audit-contract.md | AC との対応確認 |
| 必須 | outputs/phase-05/retry-policy.md | AC との対応確認 |
| 必須 | outputs/phase-06/error-case-verification.md | 異常系 AC との対応確認 |

## 実行手順

### ステップ 1: 受入条件の一覧確認

- `outputs/phase-01/requirements.md` から AC-1〜AC-7 を列挙する。
- 各 AC の達成基準（判定可能な条件）を整理する。

### ステップ 2: AC と設計文書のマッピング

- 各 AC に対して、根拠となる設計文書のパスとセクションを対応づける。
- 対応する記述が見つからない AC を「未カバー」としてマークする。

### ステップ 3: 未カバー AC の対処

- 未カバーの AC がある場合、Phase 8 での設計文書補足か Phase 5 へのフィードバックかを判断する。
- 対処方針を ac-trace-matrix.md に明記する。

### ステップ 4: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase（文書 DRY 化・整合性整理）に渡す blocker を明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 未カバー AC を文書補足の対象としてフィードバック |
| Phase 10 | gate 判定の AC PASS 確認の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: すべての受入条件が設計文書で証明できる状態か。
- 実現性: 未カバー AC の補足が既存設計の範囲で可能か。
- 整合性: AC トレースマトリクスが Phase 5 成果物と矛盾していないか。
- 運用性: Phase 10 の gate 判定でこのマトリクスを即座に参照できるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 受入条件一覧確認 | 7 | completed | requirements.md を読む |
| 2 | AC と設計文書のマッピング | 7 | completed | 6 つの成果物を横断確認 |
| 3 | 未カバー AC の対処方針決定 | 7 | completed | Phase 8 へのフィードバック |
| 4 | トレースマトリクスの作成 | 7 | completed | outputs/phase-07/ac-trace-matrix.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-trace-matrix.md | AC トレースマトリクス |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- `outputs/phase-07/ac-trace-matrix.md` が作成済み
- AC-1〜AC-7 のすべてがマトリクスに列挙されている
- 各 AC に根拠となる設計文書のパスが対応づけられている
- 未カバー AC がある場合、対処方針が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- AC-1〜AC-7 がすべてカバーされているか確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 8 (文書DRY化・整合性整理)
- 引き継ぎ事項: ac-trace-matrix.md の未カバー AC と対処方針を Phase 8 で反映する。
- ブロック条件: `ac-trace-matrix.md` が未作成なら次 Phase に進まない。

## AC トレースマトリクス雛形

| AC ID | 受入条件の概要 | 根拠となる設計文書 | 対応セクション | カバー状況 |
| --- | --- | --- | --- | --- |
| AC-1 | （要件定義から転記） | outputs/phase-05/... | セクション名 | PASS / 未カバー |
| AC-2 | （要件定義から転記） | outputs/phase-05/... | セクション名 | PASS / 未カバー |
| AC-3 | （要件定義から転記） | outputs/phase-06/... | セクション名 | PASS / 未カバー |
| AC-4 | （要件定義から転記） | outputs/phase-06/... | セクション名 | PASS / 未カバー |
| AC-5 | （要件定義から転記） | outputs/phase-06/... | セクション名 | PASS / 未カバー |
| AC-6 | （要件定義から転記） | outputs/phase-05/... | セクション名 | PASS / 未カバー |
| AC-7 | （要件定義から転記） | outputs/phase-05/... | セクション名 | PASS / 未カバー |
