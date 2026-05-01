# Phase 2: 設計 — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 2 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

evidence gate を skill / CI / lefthook の三層でどのように構成するか、各層の入出力契約と判定アルゴリズムを設計する。

## 実行タスク

1. skill 層 (task-specification-creator Phase 12 / 13 spec) の追記項目を設計する。完了条件: gate 判定アルゴリズム pseudocode が記述される。
2. CI 層 (validator job) の入力 (artifacts.json, outputs/phase-11/, 関連 followup ref) と出力 (job 成否) を設計する。完了条件: 入出力契約が表で固定される。
3. lefthook 層 (pre-push opt-in check) の責務範囲と skip 条件を設計する。完了条件: CI と lefthook の責務重複が排除される。

## 参照資料

- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/task-specification-creator/references/phase-12-spec.md
- docs/30-workflows/02-application-implementation/_templates/artifacts-template.json
- .github/workflows/verify-indexes.yml
- lefthook.yml

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- 設計記述は spec 文書のみ。skill / workflow / hook の正本ファイルには触れない。
- 三層は独立 PR で実装可能な責務分離とする。

## 統合テスト連携

- 上流: Phase 1 で確定した三層責務境界、AC、approval gate
- 下流: Phase 3 設計レビュー、Phase 4 テスト戦略

## 多角的チェック観点

- skill governance（Phase 12 / 13 spec 追記の整合）
- audit traceability（artifacts.json schema 拡張の後方互換）
- CI gate 一貫性（既存 verify-indexes と機能重複しない）
- lefthook 軽量性（pre-push を遅延させない）
- 未実装/未実測を PASS と扱わない
- spec のみで完結する

## サブタスク管理

- [ ] skill 層の追記項目と pseudocode を記述
- [ ] CI 層の入出力契約表を作成
- [ ] lefthook 層の skip 条件を記述
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- outputs/phase-02/main.md

## 完了条件

- 三層それぞれに入力 / 判定 / 出力の契約が記述される
- artifacts.json schema 拡張案が後方互換であることが示される
- VISUAL / NON_VISUAL / followup issued の三分岐すべてに gate 設計が対応する
- 既存 verify-indexes gate との責務重複がないことが明記される

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 三層が独立 PR で実装可能な責務分離になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 3 へ、三層設計、入出力契約、判定アルゴリズム pseudocode を渡す。
