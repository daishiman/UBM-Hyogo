# Phase 12: ドキュメント更新

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 12 |
| 名称 | ドキュメント更新 |
| 依存Phase | Phase 1, Phase 2, Phase 5, Phase 6, Phase 7, Phase 8, Phase 9, Phase 10, Phase 11 |
| 次Phase | Phase 13 |

## 目的

task-specification-creator の strict 7 files と aiworkflow-requirements 正本同期を完了し、既存 15 primitives baseline と task-10 11 primitive contract の二重正本を解消する。

## 実行タスク

| Task | 成果物 | 内容 |
| --- | --- | --- |
| Task 12-0 | `main.md` | Phase 12 本体 |
| Task 12-1 | `implementation-guide.md` | Part 1 中学生レベル + Part 2 技術詳細 |
| Task 12-2 | `system-spec-update-summary.md` | Step 1-A〜1-C / Step 2 / aiworkflow sync |
| Task 12-3 | `documentation-changelog.md` | 更新履歴 |
| Task 12-4 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも出力 |
| Task 12-5 | `skill-feedback-report.md` | 改善なしでも出力 |
| Task 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | root evidence |

- Task 12-A: root `artifacts.json` と `outputs/artifacts.json` を完全一致させる。
- Task 12-B: `.claude/skills/aiworkflow-requirements/references/ui-ux-components.md` に task-10 integration contract を追記する。
- Task 12-C: `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`, `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`, `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` に task-10 root を登録する。
- Task 12-D: `validate-phase-output.js` と `verify-all-specs.js --workflow` を実行する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 11 | `phase-11.md` | runtime boundary |
| Phase 13 | `phase-13.md` | user gate |
| Phase 12 spec | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | strict 7 files |
| aiworkflow skill | `.claude/skills/aiworkflow-requirements/SKILL.md` | 正本同期 |

## 実行手順

1. strict 7 files を `outputs/phase-12/` に配置する。
2. root / outputs artifacts parity を確認する。
3. aiworkflow-requirements の current canonical set を更新する。
4. 検証コマンドを実行して結果を compliance check に記録する。

## 多角的チェック観点（AIが判断）

| 条件 | 確認 |
| --- | --- |
| 矛盾なし | Wave 0 baseline と task-10 contract が一本化されている |
| 漏れなし | strict 7 files と artifacts parity がある |
| 整合性あり | 状態語彙が `spec_created / implementation / VISUAL_ON_EXECUTION` で統一 |
| 依存関係整合 | task-11..17 の gating と current UI export が一致 |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| strict outputs | `outputs/phase-12/*.md` |
| aiworkflow sync | `.claude/skills/aiworkflow-requirements/**` |

## 成果物

| 成果物 | パス |
| --- | --- |
| main | `outputs/phase-12/main.md` |
| implementation guide | `outputs/phase-12/implementation-guide.md` |
| system spec summary | `outputs/phase-12/system-spec-update-summary.md` |
| documentation changelog | `outputs/phase-12/documentation-changelog.md` |
| unassigned detection | `outputs/phase-12/unassigned-task-detection.md` |
| skill feedback | `outputs/phase-12/skill-feedback-report.md` |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 完了条件

- [ ] Phase 12 strict 7 files が存在する。
- [ ] root `artifacts.json` と `outputs/artifacts.json` が一致している。
- [ ] aiworkflow-requirements の UI primitive 正本が同期されている。
- [ ] `validate-phase-output.js` が成功している。
- [ ] `verify-all-specs.js --workflow` が成功している。

## タスク100%実行確認【必須】

- [ ] Task 12-0 完了
- [ ] Task 12-1 完了
- [ ] Task 12-2 完了
- [ ] Task 12-3 完了
- [ ] Task 12-4 完了
- [ ] Task 12-5 完了
- [ ] Task 12-6 完了
- [ ] Task 12-A 完了
- [ ] Task 12-B 完了
- [ ] Task 12-C 完了
- [ ] Task 12-D 完了

## 次Phase

Phase 13 はユーザー明示承認後にのみ commit / push / PR を扱う。
