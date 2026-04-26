# Phase 11: 手動確認・ウォークスルー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| タスク種別 | docs-only（設計文書作成のみ。コード・テスト実装なし） |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動確認・ウォークスルー |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビューゲート) |
| 次 Phase | 12 (ドキュメント更新・正本同期) |
| 状態 | completed |

## 目的

設計文書を実際に読み通し、UT-09 担当者が迷いなく実装着手できる状態かをウォークスルーで確認する。
本タスクは docs-only のため、スクリーンショット・動作確認等は不要。設計文書の読み通しによる論理的整合性の確認で代替する。

> **注記**: UIタスクではないため、スクリーンショット・ブラウザ確認等は不要。
> 設計文書（Markdown ファイル）を順を追って読み通すことで「手動 smoke test」の代替とする。

## 実行タスク

- 設計文書一式の順次読み通し（index → Phase 1 要件 → Phase 5 設計文書 → Phase 6 エラー検証）
- UT-09 担当者の視点でのウォークスルー（実装判断に迷う箇所がないかの確認）
- 設計文書間のリンク・参照パスの確認
- ウォークスルー結果の記録

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-10/final-review.md | GO 判定の確認 |
| 必須 | outputs/phase-01/requirements.md | 要件のウォークスルー |
| 必須 | outputs/phase-05/sync-method-comparison.md | 設計のウォークスルー |
| 必須 | outputs/phase-05/sequence-diagrams.md | フローのウォークスルー |
| 必須 | outputs/phase-05/sync-audit-contract.md | スキーマのウォークスルー |
| 必須 | outputs/phase-05/retry-policy.md | リトライポリシーのウォークスルー |
| 必須 | outputs/phase-06/error-case-verification.md | 異常系のウォークスルー |

## 実行手順

### ステップ 1: ウォークスルーの前提確認

- Phase 10 の final-review.md で GO 判定が出ていることを確認する。
- ウォークスルーの読み通し順序を決定する（要件 → 設計 → 異常系の順を推奨）。

### ステップ 2: 設計文書の順次読み通し

以下の順序で設計文書を読み通す:
1. `outputs/phase-01/requirements.md` — タスクの目的・受入条件を確認
2. `outputs/phase-05/sync-method-comparison.md` — 採用方式とその理由を確認
3. `outputs/phase-05/sequence-diagrams.md` — 正常系・異常系のフローを確認
4. `outputs/phase-05/sync-audit-contract.md` — テーブルスキーマを確認
5. `outputs/phase-05/retry-policy.md` — リトライ戦略を確認
6. `outputs/phase-06/error-case-verification.md` — エラーケースの対処を確認

### ステップ 3: UT-09 担当者視点での確認

- 「この設計文書だけで実装着手できるか」を確認する。
- 判断に迷う箇所・前提が不明な箇所を walkthrough-report.md にリストアップする。
- リストアップした箇所の対処（即時修正 / Phase 12 での補足 / open question として記録）を決定する。

### ステップ 4: 結果の記録と handoff

- ウォークスルー結果を walkthrough-report.md にまとめる。
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase（ドキュメント更新・正本同期）に渡す事項を明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | walkthrough-report.md を spec sync 判断の入力として使用 |

## 多角的チェック観点（AIが判断）

- 価値性: ウォークスルーを通じて UT-09 担当者の実装着手可能性が確認できたか。
- 実現性: 設計文書が実際の実装に必要な情報を網羅しているか。
- 整合性: 読み通しを通じて文書間の矛盾が発見されなかったか。
- 運用性: 設計文書から運用フローを追跡できる構造になっているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ウォークスルー前提確認 | 11 | completed | final-review.md の GO 確認 |
| 2 | 設計文書の順次読み通し | 11 | completed | 6 文書を順次確認 |
| 3 | UT-09 担当者視点での確認 | 11 | completed | 迷いがある箇所を記録 |
| 4 | 結果の記録 | 11 | completed | outputs/phase-11/walkthrough-report.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/walkthrough-report.md | ウォークスルー結果レポート |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- `outputs/phase-11/walkthrough-report.md` が作成済み
- 設計文書 6 文書すべての読み通し結果が記録されている
- UT-09 担当者が実装着手できる状態と確認されている（または残課題が明記）
- Phase 12 への handoff 事項が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- ウォークスルーで発見した問題が解消されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新・正本同期)
- 引き継ぎ事項: walkthrough-report.md の残課題を Phase 12 の spec sync 判断に活用する。
- ブロック条件: `walkthrough-report.md` が未作成なら次 Phase に進まない。

## ウォークスルーチェックリスト

| 確認項目 | 状態 | 備考 |
| --- | --- | --- |
| 採用する同期方式とその理由が明確か | completed | sync-method-comparison.md |
| 正常系のフローが追跡できるか | completed | sequence-diagrams.md |
| 異常系（部分失敗・quota 超過）のフローが明確か | completed | sequence-diagrams.md |
| sync_audit のスキーマが実装に十分な粒度か | completed | sync-audit-contract.md |
| リトライ戦略が具体的な数値で記述されているか | completed | retry-policy.md |
| エラーケース 5 シナリオの対処が明記されているか | completed | error-case-verification.md |
| UT-09 担当者が迷いなく実装着手できるか | completed | 総合判断 |

## 失敗時の戻り先（逆引き表）

| 問題 | 戻り先 |
| --- | --- |
| フロー図に矛盾がある | Phase 5 (sequence-diagrams.md 修正) |
| エラーケースの対処が不明 | Phase 6 (error-case-verification.md 補足) |
| AC が未カバーのまま残っている | Phase 7 / 8 |
| 用語の不統一が残っている | Phase 8 (refactoring-report.md 対応) |
