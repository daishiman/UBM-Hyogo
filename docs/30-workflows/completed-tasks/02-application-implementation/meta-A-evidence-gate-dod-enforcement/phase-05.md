# Phase 5: 実装ランブック — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 5 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

将来 spec を実コードに反映する際の手順を、独立 PR 単位で 3 本のランブックとして固定する。本タスク自体ではコード変更を行わない。

## 実行タスク

1. PR-A (skill spec 更新) のランブックを記述する。完了条件: 対象ファイル、追記内容の要点、approval gate が明記される。
2. PR-B (CI validator job 追加) のランブックを記述する。完了条件: workflow ファイル名、trigger 条件、failing 例外処理が明記される。
3. PR-C (lefthook pre-push opt-in check 追加) のランブックを記述する。完了条件: hook 名、skip 条件、opt-in env 変数が明記される。

## 参照資料

- Phase 2 設計、Phase 4 test 観点
- .claude/skills/task-specification-creator/references/
- .github/workflows/
- lefthook.yml
- CLAUDE.md (sync-merge hook policy)

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- 本タスク内では runbook を spec 化するのみ。コード変更は別 PR / 別タスクで実行する。
- 3 PR は parallel 着手可能。マージ順は skill → CI → lefthook 推奨。

## 統合テスト連携

- 上流: Phase 4 test 観点
- 下流: Phase 6 異常系、Phase 11 evidence

## 多角的チェック観点

- skill governance
- audit traceability
- CI gate 一貫性
- lefthook 軽量性、sync-merge skip 整合
- 未実装/未実測を PASS と扱わない
- spec のみで完結する

## サブタスク管理

- [ ] PR-A skill spec runbook を記述
- [ ] PR-B CI validator runbook を記述
- [ ] PR-C lefthook runbook を記述
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md

## 完了条件

- 3 PR の対象ファイル、変更要点、approval gate が runbook として固定される
- 推奨マージ順が記載される
- 各 PR 単独で revert 可能な切り出しになっている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 3 PR が独立 revertable に切り出されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 6 へ、3 PR runbook、approval gate、推奨マージ順を渡す。
