# Phase 3: 設計レビュー — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 3 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 設計が「12 followup の真因」を構造的に塞ぐかを 4 条件 (矛盾なし / 漏れなし / 整合性 / 依存関係) で検証する。

## 実行タスク

1. 設計が VISUAL / NON_VISUAL / followup issued の三分岐を漏れなくカバーするかを検証する。完了条件: カバレッジ表が記録される。
2. skill / CI / lefthook 三層間の判定矛盾がないかを確認する。完了条件: 矛盾検出 0 件、もしくは検出時の解消方針が明記される。
3. solo 開発ポリシー (required_pull_request_reviews=null) との整合を確認する。完了条件: governance 上の競合がないことが記録される。

## 参照資料

- Phase 2 設計文書
- CLAUDE.md (Branch / Governance section)
- .github/CODEOWNERS
- .claude/skills/task-specification-creator/references/

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- 仕様書のみ更新。skill / workflow / hook の正本に触れない。
- 矛盾検出時は Phase 2 へ feedback、Phase 4 以降には進めない。

## 統合テスト連携

- 上流: Phase 2 設計、三層責務境界
- 下流: Phase 4 テスト戦略

## 多角的チェック観点

- skill governance との整合
- audit traceability（artifacts.json と outputs の往復）
- CI gate と branch protection の整合
- solo 運用ポリシー（review 不要）との整合
- 未実装/未実測を PASS と扱わない
- spec のみで完結する

## サブタスク管理

- [ ] 三分岐カバレッジ表を作成
- [ ] 三層判定矛盾チェック結果を記録
- [ ] solo policy 整合確認結果を記録
- [ ] outputs/phase-03/main.md を作成する

## 成果物

- outputs/phase-03/main.md

## 完了条件

- 三分岐すべてに gate 判定が割り当てられている
- skill / CI / lefthook 間の判定矛盾が 0 件
- solo 運用ポリシーとの競合がない
- 検出された懸念は Phase 2 への feedback ループとして記録される

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 4 条件 (矛盾なし / 漏れなし / 整合性 / 依存関係) で検証している
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ、検証済み設計、三層責務境界、矛盾解消方針を渡す。
