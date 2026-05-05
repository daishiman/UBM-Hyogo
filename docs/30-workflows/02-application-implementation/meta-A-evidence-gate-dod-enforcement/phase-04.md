# Phase 4: テスト戦略 — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 4 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

evidence gate spec が将来コード化された際に検証可能な test 観点を、spec 段階で確定する。

## 実行タスク

1. CI validator job の unit / contract test 観点を列挙する。完了条件: VISUAL / NON_VISUAL / followup-issued / missing の 4 ケースが記録される。
2. lefthook hook の skip / fail / pass パターンの test 観点を列挙する。完了条件: merge-commit skip / 通常 push / evidence 欠落の各ケースが記録される。
3. skill spec の互換性検証観点を列挙する。完了条件: 既存 followup タスクが retroactively fail しないことを確認する観点が記録される。

## 参照資料

- Phase 2 設計、Phase 3 レビュー結果
- .github/workflows/verify-indexes.yml
- lefthook.yml
- 既存 12 followup タスク群

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- spec のみ。test コードは書かない。

## 統合テスト連携

- 上流: Phase 3 検証済み設計
- 下流: Phase 5 実装ランブック、Phase 11 evidence

## 多角的チェック観点

- skill governance
- audit traceability
- CI gate retroactive 互換性
- lefthook 軽量性
- 未実装/未実測を PASS と扱わない
- spec のみで完結する

## サブタスク管理

- [ ] CI validator の 4 ケース test 観点を列挙
- [ ] lefthook の 3 パターン test 観点を列挙
- [ ] skill spec 互換性観点を列挙
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md

## 完了条件

- VISUAL / NON_VISUAL / followup-issued / missing の 4 ケースが test 観点に含まれる
- 既存 12 followup が gate により retroactively fail しないことを確認する観点が含まれる
- merge commit / sync-merge 中の skip 条件が test 観点に含まれる

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] test 観点が三層すべてをカバーしている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ、test 観点リスト、retroactive 互換性条件、skip 条件を渡す。
