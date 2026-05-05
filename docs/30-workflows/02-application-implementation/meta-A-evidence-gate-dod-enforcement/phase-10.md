# Phase 10: 最終レビュー — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 10 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1〜9 を通じて得た成果を「12 followup 真因 → evidence gate spec」というストーリーで再俯瞰し、未対応の懸念を可視化する。

## 実行タスク

1. 真因 → 設計 → AC → runbook → 異常系 → DRY → QA の連鎖が一貫しているかを確認する。完了条件: 断絶箇所 0、もしくは追記計画が記載される。
2. solo 開発ポリシー / sync-merge hook skip / `--no-verify` 禁止ポリシーとの最終整合を確認する。完了条件: 競合 0。
3. 後続 wave の本体タスクが本 spec を参照するためのリンク配置 (master-task-list 等) を提案する。完了条件: 配置案が記載される。

## 参照資料

- Phase 1〜9 出力
- CLAUDE.md
- docs/30-workflows/00-master-task-list.md（存在すれば）

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- spec のみ。

## 統合テスト連携

- 上流: Phase 1〜9 全出力
- 下流: Phase 11 evidence、Phase 12 docs

## 多角的チェック観点

- skill governance
- audit traceability
- CI gate 一貫性
- lefthook 軽量性
- 未実装/未実測を PASS と扱わない
- spec のみで完結する

## サブタスク管理

- [ ] 連鎖一貫性確認
- [ ] policy 整合確認
- [ ] 参照リンク配置案を記述
- [ ] outputs/phase-10/main.md を作成する

## 成果物

- outputs/phase-10/main.md

## 完了条件

- ストーリー連鎖の断絶 0
- policy 競合 0
- 後続 wave の参照リンク配置案が記載される

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 連鎖一貫性が確認されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ、最終レビュー結果、未対応懸念、参照リンク配置案を渡す。
