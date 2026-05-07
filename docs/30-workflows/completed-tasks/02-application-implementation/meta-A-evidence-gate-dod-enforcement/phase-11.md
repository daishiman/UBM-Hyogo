# Phase 11: 手動 smoke / 実測 evidence — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 11 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

本タスクは spec のみであり実行可能な runtime evidence を持たない。代替として「spec 文書としての evidence」(全 phase 出力の存在 / 文書整合) を確認する手順を確定する。

## 実行タスク

1. outputs/phase-01/main.md 〜 outputs/phase-10/main.md の存在確認手順を記述する。完了条件: 確認コマンドが明記される。
2. `meta-evidence-gate` の dogfooding として、本タスク自身が evidence gate spec を満たしているかをチェックする観点を記述する。完了条件: self-check 観点が記録される。
3. user approval が必要な操作 (skill / workflow / lefthook 実コード変更) を「本タスクで実施しない」旨を明記する。完了条件: 自走禁止操作が再確認される。

## 参照資料

- outputs/phase-01〜10/main.md
- Phase 8 で集約した evidence 判定単一定義 spec

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- spec のみ。runtime evidence の収集は対象外（NON_VISUAL かつ spec-only タスク）。
- 後続でコード化される際は別タスクで evidence を収集する。

## 統合テスト連携

- 上流: Phase 10 最終レビュー
- 下流: Phase 12 docs、Phase 13 PR

## 多角的チェック観点

- skill governance
- audit traceability（spec 文書としての完全性）
- CI gate 一貫性
- lefthook 軽量性
- 未実装/未実測を PASS と扱わない
- spec のみで完結する（dogfooding として本タスクは「followup issued」分岐ではなく「NON_VISUAL spec evidence」分岐に該当）

## サブタスク管理

- [ ] 全 phase 出力の存在確認手順を記述
- [ ] self-check 観点を記述
- [ ] 自走禁止操作を再確認
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- outputs/phase-11/main.md

## 完了条件

- 全 phase 出力の存在確認手順が明記される
- 本タスク自身が dogfooding として evidence gate spec を満たすことが確認される
- 自走禁止操作が再確認される

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] dogfooding self-check が記録されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ、self-check 結果、自走禁止操作リストを渡す。
