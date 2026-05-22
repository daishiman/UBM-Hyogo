# Phase 9: 不変条件・契約整合性検査

## 9.1 既存 reference との矛盾なし

| 既存 reference | 既存記述 | 新 reference との整合性確認方法 |
| --- | --- | --- |
| phase-12-spec.md | Phase 12 の 5 タスク詳細 | vocabulary が phase-12 を「Phase 12 close-out で workflow_state を `completed` 化する条件」として参照しているか |
| phase12-skill-feedback-promotion.md | promotion target の運用 | vocabulary が promotion 観点を取り込んでいるか（記述重複ではなく link で連携） |
| phase-template-phase11.md | NON_VISUAL evidence テンプレ | reclassify ルール（Phase 11 evidence 配置時に `implemented_local_evidence_captured` へ遷移）が一致 |

確認コマンド:
```bash
diff <(rg -o 'spec_created|CONTRACT_READY_IMPLEMENTATION_PENDING|PASS_BOUNDARY_SYNCED_RUNTIME_PENDING' .claude/skills/task-specification-creator/references/phase-template-phase11.md | sort -u) \
     <(rg -o 'spec_created|CONTRACT_READY_IMPLEMENTATION_PENDING|PASS_BOUNDARY_SYNCED_RUNTIME_PENDING' .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md | sort -u)
```
期待: 既存 phase-template-phase11.md に登場する状態名は vocabulary にすべて含まれる。

## 9.2 状態名の不変

```bash
git diff main -- .claude/skills/task-specification-creator/SKILL-changelog.md
```
期待: 既存 version 行（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 初出を含む）は変更されていない。新 version 行が末尾追加（時系列順では先頭）のみ。

## 9.3 SKILL-changelog.md 過去行の不変

```bash
git diff main -- .claude/skills/task-specification-creator/SKILL-changelog.md \
  | grep '^-' | grep -v '^---' \
  | tee outputs/phase-11/evidence/changelog-deletions.log
```
期待: 削除行ゼロ（追加のみ）。

## 9.4 LOGS/_legacy.md 既存行の不変

```bash
git diff main -- .claude/skills/task-specification-creator/LOGS/_legacy.md \
  | grep '^-' | grep -v '^---' \
  | tee outputs/phase-11/evidence/logs-deletions.log
```
期待: 削除行ゼロ（追加のみ）。

## 9.5 SKILL.md 既存 References 表行の不変

```bash
git diff main -- .claude/skills/task-specification-creator/SKILL.md \
  | grep '^-' | grep -v '^---' \
  | tee outputs/phase-11/evidence/skillmd-deletions.log
```
期待: 削除行ゼロ（References 表への追加のみ）。

## 9.6 indexes drift なし

```bash
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes; echo "exit=$?"
```
期待: exit=0（rebuild 結果がコミット済み）。

## 9.7 不変条件チェック表

| 不変条件 | 検査 | 結果記録先 |
| --- | --- | --- |
| skill 正本一元化 | vocabulary に状態定義の本体、既存 reference は link のみ | 9.1 |
| 既存状態名の不変 | SKILL-changelog.md 過去行 diff = 削除なし | 9.2 / 9.3 |
| 既存 LOGS/_legacy.md 行の不変 | LOGS/_legacy.md diff = 削除なし | 9.4 |
| SKILL.md References 既存行の不変 | SKILL.md diff = 削除なし | 9.5 |
| `verify-indexes-up-to-date` 整合 | indexes drift なし | 9.6 |

## DoD

- [ ] 9.1-9.6 の全コマンドが期待通り
- [ ] `outputs/phase-11/evidence/` に invariant 検査ログが配置

## 次フェーズへの引き渡し

Phase 10 では本タスクの残存リスクを再評価する。
