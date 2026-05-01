# Phase 9: 品質保証 — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 9 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

spec 全体に対して typecheck / lint 相当の整合確認を行い、文書としての品質を保証する。

## 実行タスク

1. index.md / artifacts.json / phase-01〜13 のメタ情報整合 (wave / mode / taskType / visualEvidence) を確認する。完了条件: drift 0。
2. 参照ファイルパスが実在することを確認する。完了条件: 全パス resolvable、もしくは備考付きで未存在を許容する根拠が記録される。
3. AC・完了条件・runbook が「spec のみ・コード変更なし」原則を破っていないかを確認する。完了条件: 違反 0。

## 参照資料

- index.md
- artifacts.json
- phase-01〜phase-13.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- spec のみ。

## 統合テスト連携

- 上流: Phase 8 DRY 化
- 下流: Phase 10 最終レビュー

## 多角的チェック観点

- skill governance
- audit traceability
- CI gate 一貫性
- lefthook 軽量性
- 未実装/未実測を PASS と扱わない
- spec のみで完結する

## サブタスク管理

- [ ] メタ情報 drift 検査
- [ ] 参照パス実在確認
- [ ] spec-only 原則遵守確認
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- outputs/phase-09/main.md

## 完了条件

- メタ情報 drift 0
- 参照パス未解決 0、または許容根拠が記録される
- spec-only 原則違反 0

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] drift / 違反 0 が確認されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ、整合確認結果、未解決事項リストを渡す。
