# workflow skill-ledger-a3-progressive-disclosure artifact inventory

> 対象タスク: Issue #131 / `task-skill-ledger-a3-progressive-disclosure`
> 最終更新日: 2026-04-28
> 目的: A-3 Progressive Disclosure を `task-specification-creator` に適用したワークフローの canonical 成果物を完全列挙する

---

## 概要

本 inventory は A-3（SKILL.md 200 行ガード適用）を `task-specification-creator` に適用したワークフローで生成・改訂された全ファイルの一覧を、引用と監査用に保持する。
`docs/30-workflows/skill-ledger-a3-progressive-disclosure/` を workflow root、`.claude/skills/task-specification-creator/` を canonical skill root、`.agents/skills/task-specification-creator/` を mirror skill root とする。

詳細設計は `references/skill-ledger-progressive-disclosure.md` §A-3 適用事例、苦戦箇所は `references/lessons-learned-skill-ledger-redesign-2026-04.md` L-SLR-010〜014 を参照。

---

## 集計

| 区分 | 件数 | 補足 |
| --- | --- | --- |
| 改訂 SKILL.md | 1 | 315 → 116 行（entry 化） |
| 新規 references | 6 | task-specification-creator 配下 |
| workflow 仕様書（root） | 15 | `phase-01..13.md` / `index.md` / `artifacts.json` |
| workflow outputs | 32 | `outputs/` 配下の成果物・evidence・スクリプト |
| aiworkflow-requirements 反映ファイル | 6 | LOGS / quick-reference / resource-map / progressive-disclosure / lessons-learned / artifact-inventory |
| 合計 | 60 | canonical のみ。mirror は重複計上しない |

---

## 改訂された SKILL.md（task-specification-creator）

| パス | 役割 |
| --- | --- |
| `.claude/skills/task-specification-creator/SKILL.md` | entry（116 行）。loader 起動判断要素のみ保持 |

## 新規 references（task-specification-creator 配下）

| パス | 責務 |
| --- | --- |
| `.claude/skills/task-specification-creator/references/orchestration.md` | サブエージェント編成・並列実行 |
| `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md` | Phase 12 罠（UBM-009〜013） |
| `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase 12 仕様（中学生レベル概念説明含む） |
| `.claude/skills/task-specification-creator/references/quality-gates.md` | 品質ゲート定義 |
| `.claude/skills/task-specification-creator/references/requirements-review.md` | 要件レビュー手順 |
| `.claude/skills/task-specification-creator/references/task-type-decision.md` | タスクタイプ判定（docs-only / non_visual / visual） |

## workflow 仕様書（root）

| パス | 役割 |
| --- | --- |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md` | ワークフロー全体インデックス・PR 分割方針 |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/artifacts.json` | artifact マニフェスト |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-01.md` | Phase 1 要件定義 |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-02.md` | Phase 2 設計 |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-03.md` | Phase 3 設計レビュー |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-04.md` | Phase 4 テスト作成 |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-05.md` | Phase 5 実装 |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-06.md` | Phase 6 テスト拡張 |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-07.md` | Phase 7 カバレッジ確認 |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-08.md` | Phase 8 リファクタリング |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-09.md` | Phase 9 品質保証 |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-10.md` | Phase 10 最終レビュー |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-11.md` | Phase 11 マニュアルテスト（non_visual 代替 evidence） |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-12.md` | Phase 12 ドキュメント反映 |
| `docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-13.md` | Phase 13 PR 作成（pending_user_approval） |

## workflow outputs

- **shared**: `outputs/artifacts.json`, `outputs/verification-report.md`
- **phase-01**: `outputs/phase-01/main.md`
- **phase-02**: `outputs/phase-02/inventory.md`, `outputs/phase-02/split-design.md`
- **phase-03**: `outputs/phase-03/main.md`, `outputs/phase-03/alternatives.md`
- **phase-04**: `outputs/phase-04/test-strategy.md`, `outputs/phase-04/checklists/entry-checklist-template.md`, `outputs/phase-04/scripts/{line-count,link-integrity,mirror-diff,orphan-references}.sh`
- **phase-05**: `outputs/phase-05/implementation-runbook.md`, `outputs/phase-05/announce-template.md`, `outputs/phase-05/rollback.md`, `outputs/phase-05/evidence/{inventory,mirror-diff-task-specification-creator,post-split-line-count,targets}.log`
- **phase-06**: `outputs/phase-06/failure-cases.md`
- **phase-07**: `outputs/phase-07/ac-matrix.md`
- **phase-08**: `outputs/phase-08/main.md`, `outputs/phase-08/before-after.md`
- **phase-09**: `outputs/phase-09/main.md`, `outputs/phase-09/free-tier-estimation.md`
- **phase-10**: `outputs/phase-10/go-no-go.md`
- **phase-11**: `outputs/phase-11/main.md`, `outputs/phase-11/link-checklist.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/evidence/{line-count,link-integrity,mirror-diff,orphan-references}.log`
- **phase-12**: `outputs/phase-12/documentation-changelog.md`, `outputs/phase-12/implementation-guide.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md`, `outputs/phase-12/skill-feedback-report.md`, `outputs/phase-12/system-spec-update-summary.md`, `outputs/phase-12/unassigned-task-detection.md`

## aiworkflow-requirements 反映ファイル（本タスク close-out）

| パス | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | 2026-04-28 close-out エントリ追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference-search-patterns-skill-ledger.md` | 「A-3 他スキル適用事例」セクション新設 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | skill-ledger セクションに A-3 適用事例 / inventory 行追加 |
| `.claude/skills/aiworkflow-requirements/references/skill-ledger-progressive-disclosure.md` | 「A-3 適用事例」セクション追加 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-skill-ledger-redesign-2026-04.md` | L-SLR-010〜014 追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-skill-ledger-a3-progressive-disclosure-artifact-inventory.md` | 本ファイル新規作成 |

---

## 再生成・監査コマンド

```bash
# workflow ファイルツリー再列挙
find docs/30-workflows/skill-ledger-a3-progressive-disclosure -type f | sort

# task-specification-creator skill ファイルツリー
find .claude/skills/task-specification-creator -type f | sort

# 200 行ガード
wc -l .claude/skills/task-specification-creator/SKILL.md

# canonical / mirror 同期
diff -r .claude/skills/task-specification-creator .agents/skills/task-specification-creator
```

## 使い方

1. ワークフロー成果物の所在確認は本 inventory を起点にする
2. 親 inventory（`workflow-aiworkflow-requirements-line-budget-reform-artifact-inventory.md`）と同形式で列挙し、family register との重複は持たない
3. PR 作成（Phase 13 / 未着手）時は本 inventory を base に「1 PR = 1 skill」原則で分割する

## 変更履歴

| 日付 | バージョン | 変更内容 |
| --- | --- | --- |
| 2026-04-28 | 1.0.0 | A-3 適用ワークフロー（Issue #131 / task-specification-creator）の canonical 成果物 inventory を新規作成 |
