# Phase 6: 異常系検証 — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 6 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

evidence gate が誤判定 / 過剰検出 / バイパスされる異常系を spec 段階で列挙し、対応方針を確定する。

## 実行タスク

1. false positive 異常系を列挙する。完了条件: 「evidence は揃っているが gate が fail する」シナリオと回避策が記録される。
2. false negative 異常系を列挙する。完了条件: 「evidence が無いのに gate が pass する」シナリオと検出策が記録される。
3. bypass 異常系を列挙する。完了条件: `--no-verify` / artifacts.json 改ざん / outputs/ の placeholder 復活、への対処方針が記録される。

## 参照資料

- Phase 5 runbook
- CLAUDE.md（`--no-verify` 禁止ポリシー）
- lefthook.yml（既存 hook の skip パターン）

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- spec のみ。実コードでの異常系再現は本タスクには含めない。

## 統合テスト連携

- 上流: Phase 5 runbook
- 下流: Phase 7 AC マトリクス

## 多角的チェック観点

- skill governance
- audit traceability（改ざん検知）
- CI gate retroactive 互換性
- lefthook bypass 不可能性
- 未実装/未実測を PASS と扱わない
- spec のみで完結する

## サブタスク管理

- [ ] false positive シナリオと回避策を列挙
- [ ] false negative シナリオと検出策を列挙
- [ ] bypass シナリオと対処方針を列挙
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md

## 完了条件

- false positive / false negative / bypass の 3 区分すべてに最低 1 件のシナリオが列挙される
- bypass シナリオには `--no-verify` 禁止ポリシーと audit log の整合策が含まれる
- sync-merge hook skip との整合が記録される

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 3 区分の異常系がすべてカバーされている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 7 へ、異常系シナリオ、対処方針、bypass 禁止条件を渡す。
