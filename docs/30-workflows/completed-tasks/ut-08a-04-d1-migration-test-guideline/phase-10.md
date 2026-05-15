# Phase 10: 最終レビューゲート

## 最終チェックリスト

- [ ] Phase 1 要件が AC マトリクス（Phase 7）で全カバー
- [ ] Phase 3 4 条件評価が全 PASS
- [ ] Phase 5 実装手順が実行可能粒度（変更ファイル / 関数 / 内容明記）
- [ ] Phase 6 異常系（特に E-3 permission 不在）の防御策が Phase 5 に反映
- [ ] Phase 8 で重複なし確認
- [ ] Phase 9 ゲートコマンドが定義済み
- [ ] D1 不変条件 #5 違反なし（apps/web 変更ゼロ）
- [ ] secret コミットなし
- [ ] 新規 test file は `*.spec.ts` ではなく `*.bats`（bash 範疇のため policy 対象外）

## レビュー観点

- runbook の最低基準 3 項目が現実的なコストか（過剰負荷で守られなくなるリスクの確認）
  → 「contract test pass」と「test 1 件以上追加」は通常の PR で発生する作業範囲内
- CI comment が冗長にならないか
  → marker による idempotent update で 1 PR 1 comment 維持

## ゲート判定

ALL チェック → Phase 11 へ

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 10 |
| status | completed |

## 目的

Phase 11 へ進む前に要件、設計、検証、境界の抜けを確認する。

## 実行タスク

- 最終チェックリストをすべて確認する。
- Phase 11 / Phase 13 の evidence 境界を再確認する。

## 参照資料

- `phase-07.md`
- `phase-09.md`

## 成果物/実行手順

レビュー結果をこのファイルに記録し、Phase 11 evidence 取得へ進む。

## 完了条件

- チェックリストがすべて完了している。

## 統合テスト連携

Phase 9 の品質ゲート結果を前提にする。
