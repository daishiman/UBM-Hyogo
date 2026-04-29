# Phase 11: リンクチェック表 (link-checklist)

## 検査方法

```bash
# 内部リンク抽出
grep -RnE '\]\(.*\.md\)' docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/

# 各ターゲットの存在確認
ls <target_path>
```

外部 URL は HTTP HEAD ではなく、URL 構造の妥当性 (https / known host) と公式ドキュメントの安定性で判定（CI ネットワーク非依存のため）。

## 内部リンク（タスク内）

| 出現元 | リンク先 | 種別 | 状態 |
| --- | --- | --- | --- |
| index.md | phase-01.md 〜 phase-13.md | sibling spec | OK |
| index.md | outputs/phase-N/*.md（13 Phase 分） | output | OK |
| phase-01.md | outputs/phase-1/main.md | output | OK |
| phase-02.md | outputs/phase-2/main.md, design.md | output | OK |
| phase-03.md | outputs/phase-3/main.md, review.md | output | OK |
| phase-04.md | outputs/phase-4/main.md, test-matrix.md | output | OK |
| phase-05.md | outputs/phase-5/main.md, runbook.md | output | OK |
| phase-06.md | outputs/phase-6/main.md, failure-cases.md | output | OK |
| phase-07.md | outputs/phase-7/main.md, coverage.md | output | OK |
| phase-08.md | outputs/phase-8/main.md, before-after.md | output | OK |
| phase-09.md | outputs/phase-9/main.md, quality-gate.md | output | OK |
| phase-10.md | outputs/phase-10/main.md, go-no-go.md | output | OK |
| phase-11.md | outputs/phase-11/main.md, manual-smoke-log.md, link-checklist.md | output | OK |
| phase-12.md | outputs/phase-12/*（7 件） | output | OK |
| phase-13.md | outputs/phase-13/*（4 件） | output | OK |

**内部リンク切れ: 0 件**

## 親タスク参照リンク

| 出現元 | リンク先 | 状態 |
| --- | --- | --- |
| index.md | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/phase-02.md | OK |
| index.md | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md | OK |
| index.md | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-3/review.md | OK |
| index.md | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-5/runbook.md | OK |
| index.md | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md | OK |
| index.md | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | OK |
| index.md | docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md | OK |

**親タスクリンク切れ: 0 件**

## skill / 共通 reference リンク

| 出現元 | リンク先 | 状態 |
| --- | --- | --- |
| phase-NN.md（複数） | .claude/skills/task-specification-creator/SKILL.md | OK |
| phase-12.md | .claude/skills/task-specification-creator/references/phase-12-spec.md | OK |
| phase-12.md | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | OK |
| phase-12.md | .claude/skills/aiworkflow-requirements/SKILL.md | OK |
| 各 phase | CLAUDE.md | OK |

**skill リンク切れ: 0 件**

## 外部 URL

| 出現元 | URL | 用途 | 構造妥当性 |
| --- | --- | --- | --- |
| index.md / phase-3/review.md | https://securitylab.github.com/research/github-actions-preventing-pwn-requests/ | pwn request 解説 | OK |
| index.md / phase-2/design.md | https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target | `pull_request_target` 公式仕様 | OK |

**外部 URL: 2 件、いずれも known host・公式ドキュメント（GitHub Security Lab / GitHub Docs）であり安定到達可能と判定**

## 総合結果

| カテゴリ | 件数 | 切れ |
| --- | --- | --- |
| 内部リンク（タスク内） | 50+ | 0 |
| 親タスク参照 | 7 | 0 |
| skill / reference | 5 | 0 |
| 外部 URL | 2 | 0 |

**判定: PASS（リンク切れ 0 件）**
