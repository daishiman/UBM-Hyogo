# Phase 8: DRY 化 — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 8 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

skill / CI / lefthook 三層の spec で重複している判定ロジックを単一定義に集約する。

## 実行タスク

1. 三層共通の「evidence presence 判定」を skill spec の references/ 1 ファイルに集約する spec を記述する。完了条件: CI / lefthook はこの単一定義を参照する旨が明記される。
2. artifacts.json schema 拡張を 1 ファイルに集約する spec を記述する。完了条件: schema 二重定義が排除される。
3. followup ref フォーマット (どの directory 名規約で followup と認定するか) を 1 ファイルに集約する。完了条件: 三層がこの規約を参照する。

## 参照資料

- Phase 2 設計、Phase 7 AC マトリクス
- .claude/skills/task-specification-creator/references/

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- 集約は spec 上の参照関係宣言のみ。実ファイル統合は別 PR で実施。

## 統合テスト連携

- 上流: Phase 7 AC マトリクス
- 下流: Phase 9 品質保証

## 多角的チェック観点

- skill governance（単一情報源）
- audit traceability
- CI gate 一貫性
- lefthook 軽量性
- 未実装/未実測を PASS と扱わない
- spec のみで完結する

## サブタスク管理

- [ ] evidence 判定単一定義 spec を記述
- [ ] artifacts.json schema 集約 spec を記述
- [ ] followup ref 規約集約 spec を記述
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md

## 完了条件

- 三層共通の判定ロジックが単一定義に集約される
- artifacts.json schema 拡張が 1 箇所に集約される
- followup ref 規約が 1 箇所に集約される

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 重複定義が排除されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、単一定義参照表、集約済み schema spec を渡す。
