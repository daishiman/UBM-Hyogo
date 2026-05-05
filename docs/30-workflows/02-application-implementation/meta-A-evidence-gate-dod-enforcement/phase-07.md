# Phase 7: AC マトリクス — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 7 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

index.md の AC を、Phase 1〜6 で確定した三層 spec / test 観点 / 異常系 / runbook と紐づけ、抜け漏れを排除する。

## 実行タスク

1. AC ↔ Phase 出力のトレーサビリティ表を作成する。完了条件: 各 AC が Phase 02 / 04 / 05 / 06 のどの章で担保されるかが特定される。
2. 未紐付け AC または未紐付け Phase 出力を検出する。完了条件: 抜け漏れ 0、もしくは Phase 戻し計画が記載される。
3. retroactive 互換性 (既存 12 followup が現状 fail しない) が AC として明記されているかを確認する。完了条件: 該当 AC が確認される、または追記される。

## 参照資料

- index.md (AC セクション)
- Phase 02 / 04 / 05 / 06 出力

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- spec のみ。

## 統合テスト連携

- 上流: Phase 2〜6
- 下流: Phase 8 DRY 化

## 多角的チェック観点

- skill governance
- audit traceability
- CI gate retroactive 互換性
- lefthook 軽量性
- 未実装/未実測を PASS と扱わない
- spec のみで完結する

## サブタスク管理

- [ ] AC ↔ Phase 出力対応表を作成
- [ ] 抜け漏れ検出結果を記録
- [ ] retroactive 互換性 AC を確認
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md

## 完了条件

- 全 AC が Phase 出力に紐付く
- 抜け漏れ 0、もしくは Phase 戻し計画が明記される
- retroactive 互換性 AC が含まれる

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 抜け漏れ 0 が確認されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ、AC トレーサビリティ表、未紐付け対応計画を渡す。
