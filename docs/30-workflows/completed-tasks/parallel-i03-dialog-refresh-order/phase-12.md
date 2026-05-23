# Phase 12: 正本同期

## 目的

実装結果を canonical workflow root (`docs/30-workflows/parallel-i03-dialog-refresh-order/`) と関連 docs に同期し、Phase 12 strict compliance 4 条件を満たす 7 出力ファイルを生成する。

## Task 12-1..12-6 と必須出力 7 ファイル

| Task | 出力ファイル | 役割 |
|------|-------------|------|
| main | `outputs/phase-12/main.md` | Phase 12 全体サマリ・各 sub-task の結論集約 |
| 12-1 implementation-guide | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベルの実装ガイド |
| 12-2 system-spec-update | `outputs/phase-12/system-spec-update-summary.md` | システム仕様への影響範囲（本タスクは UI client 内完結なので大半 N/A だが明示） |
| 12-3 documentation-changelog | `outputs/phase-12/documentation-changelog.md` | docs 変更履歴（spec.md status 更新・本 workflow root 新設） |
| 12-4 unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` | 残存技術債・他 dialog で同 pattern が必要かの検出結果 |
| 12-5 skill-feedback | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator 等 skill 利用上の改善点 |
| 12-6 compliance-check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 strict compliance / 4 条件 / compact evidence |

## Task 12-1: main.md

- 全 sub-task の結論を 1 ページに集約
- 中学生レベル概念説明を含める（中学生に refresh→onSubmitted→onClose の意味を説明できる粒度）

## Task 12-2: implementation-guide.md

- Before/After snippet（VisibilityRequestDialog / DeleteRequestDialog / RequestActionPanel）
- 順序契約 (refresh → onSubmitted → onClose)
- test pattern（`callOrder.push` 方式）
- 検証コマンド一覧
- このガイド単体で実装再現可能なレベル

## Task 12-3: system-spec-update-summary.md

- API 変更: なし
- D1 schema 変更: なし
- env binding 変更: なし
- UI 仕様変更: dialog 内部の呼び出し順序のみ
- 親仕様 `parallel-02-state-sync` §4.2 との整合: 実装完了

## Task 12-4: documentation-changelog.md

- workflow root 新設
- spec.md スコープ確定ノート status: pending → completed
- 親仕様への完了マーカー追記

## Task 12-5: unassigned-task-detection.md

- 同様の race condition pattern が他 dialog にないか検出（admin 系 dialog 含む）
- 検出されたものは新規 unassigned-task として記録

## Task 12-6: skill-feedback-report.md

- task-specification-creator skill 利用フィードバック
- NON_VISUAL 判定の合理性チェック

## Task 12-6: phase12-task-spec-compliance-check.md

Phase 12 strict compliance 4 条件:
1. 全 7 ファイル存在
2. main.md に中学生レベル概念説明あり
3. implementation-guide.md だけで再現可能
4. compact evidence (30 種規定) 列挙

## DoD

- [x] 7 ファイル全て存在
- [x] main.md に中学生レベル概念説明あり
- [x] implementation-guide.md だけで実装再現可能
- [x] `phase12-task-spec-compliance-check.md` に 4 条件 completed evidence
