# Phase 1: 要件定義 — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 1 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

evidence gate を導入する真因、scope、依存境界、成功条件を確定する。本タスクが「12 followup を生んだ DoD の構造欠陥」をどう塞ぐかを文書として固定する。

## 実行タスク

1. 12 個の既存 followup の発生原因を整理する。完了条件: 「evidence 欠落 → completed 化」共通パターンが明示される。
2. evidence gate の対象 layer (skill / CI / hook) と責務分担を確認する。完了条件: 三層の境界が記録される。
3. user approval が必要な操作（skill 本体変更、workflow 追加）を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/task-specification-creator/references/phase-12-spec.md
- docs/30-workflows/02-application-implementation/_templates/task-index-template.md
- docs/30-workflows/02-application-implementation/_templates/artifacts-template.json
- docs/30-workflows/02-application-implementation/06b-A-me-api-authjs-session-resolver/index.md
- .github/workflows/verify-indexes.yml
- lefthook.yml

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- 本仕様書作成では skill 本体、workflow YAML、lefthook.yml への直接変更を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 既存 12 followup タスク群、task-specification-creator skill, aiworkflow-requirements skill
- 下流: 後続 wave の本体タスクすべての close-out DoD

## 多角的チェック観点

- skill governance（Phase 12 / 13 spec の整合）
- audit traceability（artifacts.json と outputs/phase-11/ の対応）
- close-out DoD（spec_created → completed の遷移条件）
- CI gate 一貫性（verify-indexes と evidence gate の責務分離）
- 未実装/未実測を PASS と扱わない
- spec のみで完結し、実コードに踏み込まない

## サブタスク管理

- [ ] 12 followup の根本原因を 1 行ずつ整理する
- [ ] evidence gate 三層の責務境界を表形式で記録する
- [ ] approval gate / blocker を明記する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md

## 完了条件

- evidence gate の対象 layer と責務が確定する
- AC が「skill spec / CI validator spec / lefthook spec」の三本柱で表現される
- VISUAL / NON_VISUAL いずれの evidence 欠落も「followup issued」で代替可能な OR ゲートが明記される
- 本タスクが governance-spec / docs-only であることが明示される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく meta-control gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ、AC、blocker、evidence path、approval gate、三層責務境界を渡す。
