# Phase 13: commit / PR 承認ゲート

> **必須**: 本 Phase は `user_approval_required: true`。ユーザーから明示的な承認を得た後にのみ実行する。

## 13.1 承認待機条件

以下が揃っている状態で、ユーザーへ完了報告と PR 作成承認を求める:

- Phase 1-12 すべての outputs が揃っている
- `outputs/phase-11/evidence/` の必須 13 ファイル PASS
- `outputs/phase-12/` の必須 7 ファイル配置済み
- skill / aiworkflow ledger 配下の changed-files（新規 reference 2 + skill edits + inventory/index sync）が想定通り
- `mise exec -- pnpm indexes:rebuild` 後に drift なし

## 13.2 commit 戦略

```bash
# 段階 1: skill 文書 + aiworkflow ledger/index sync
git add .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md \
        .claude/skills/task-specification-creator/references/phase12-compliance-check-template.md \
        .claude/skills/task-specification-creator/SKILL.md \
        .claude/skills/task-specification-creator/references/phase-12-spec.md \
        .claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md \
        .claude/skills/task-specification-creator/references/phase-template-phase11.md \
        .claude/skills/task-specification-creator/references/resource-map.md \
        .claude/skills/task-specification-creator/SKILL-changelog.md \
        .claude/skills/task-specification-creator/LOGS/_legacy.md \
        .claude/skills/aiworkflow-requirements/LOGS/_legacy.md \
        .claude/skills/aiworkflow-requirements/SKILL-changelog.md \
        .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
        .claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md \
        .claude/skills/aiworkflow-requirements/indexes

git commit -m "$(cat <<'EOF'
feat(skill): promote workflow_state vocabulary + phase12 compliance-check template

issue #534 完了に伴い workflow_state 状態語彙と Phase 12 compliance-check テンプレを
task-specification-creator skill 本体へ昇格する。

- references/workflow-state-vocabulary.md（新規）: 5 状態の意味 / 必要証跡マッピング / reclassify ルール / 禁止表記
- references/phase12-compliance-check-template.md（新規）: 観点 / 検証コマンド / drift パターン例
- SKILL.md References 表へ 2 件追加
- phase-12-spec.md / phase12-skill-feedback-promotion.md / phase-template-phase11.md から新 reference へ link 追加
- SKILL-changelog.md / LOGS/_legacy.md 同期
- aiworkflow-requirements ledger / indexes:rebuild の差分を同一コミットに含める

Refs #534

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 段階 2: workflow ディレクトリ
git add docs/30-workflows/issue-534-skill-workflow-state-guidance/ \
        docs/30-workflows/unassigned-task/task-spec-skill-workflow-state-hook-enforcement.md \
        docs/30-workflows/unassigned-task/task-spec-skill-compliance-check-ci-gate.md

git commit -m "$(cat <<'EOF'
docs(workflow): add issue-534 task spec + 2 unassigned follow-up specs

- docs/30-workflows/issue-534-skill-workflow-state-guidance/（Phase 1-13 + outputs）
- docs/30-workflows/unassigned-task/task-spec-skill-workflow-state-hook-enforcement.md（後続）
- docs/30-workflows/unassigned-task/task-spec-skill-compliance-check-ci-gate.md（後続）

Refs #534

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

## 13.3 push と PR 作成

```bash
git push -u origin docs/issue-534-skill-workflow-state-guidance

gh pr create \
  --base dev \
  --title "feat(skill): promote workflow_state vocabulary + phase12 compliance-check (issue #534)" \
  --body "$(cat <<'EOF'
## Summary
- workflow_state 状態語彙を `task-specification-creator` skill 本体へ昇格
- Phase 12 compliance-check 観点をテンプレ化し再利用可能に
- Refs #534

## Changes
- 新規: `references/workflow-state-vocabulary.md`、`references/phase12-compliance-check-template.md`
- 編集: SKILL.md / 既存 reference 4 件 / SKILL-changelog.md / LOGS/_legacy.md
- 同期: `.claude/skills/aiworkflow-requirements/{LOGS/_legacy.md,SKILL-changelog.md,references/task-workflow-active.md,references/task-workflow-backlog.md,indexes}`（Issue #534 inventory + drift 解消）
- workflow: `docs/30-workflows/issue-534-skill-workflow-state-guidance/` Phase 1-13
- unassigned: 後続 2 件の spec stub を `docs/30-workflows/unassigned-task/` に配置

## Test plan
- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `mise exec -- pnpm indexes:rebuild` 後の `git diff --exit-code .claude/skills/aiworkflow-requirements/indexes` が exit 0
- [ ] SKILL.md References 表から新 reference 2 件へ 1 hop 到達
- [ ] phase-12-spec.md / phase12-skill-feedback-promotion.md / phase-template-phase11.md から新 reference へ link 到達
- [ ] outputs/phase-11/evidence/ の必須 13 ログ PASS
- [ ] outputs/phase-12/ の必須 7 ファイル揃い

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 13.4 完了処理

PR merge 後（ユーザー側で実施）:

1. artifacts.json `metadata.workflow_state` を `completed` に更新
2. workflow ディレクトリを `docs/30-workflows/completed-tasks/issue-534-skill-workflow-state-guidance/` へ移動
3. `mise exec -- pnpm indexes:rebuild` を再実行し drift がないことを確認

これらは本タスクの Phase 13 では実行しない（本タスクは PR 作成までで完了）。完了後の移動は別 PR で行うか、merge 直後の同期作業として行う。

## DoD

- [ ] ユーザー承認を得てから実行
- [ ] 段階 1 / 段階 2 の 2 commit が作成される
- [ ] `git push` が成功
- [ ] PR が `dev` ブランチを base に作成される
- [ ] PR 本文に Test plan 全項目の checkbox が含まれる

## 失敗時のフォールバック

- pre-commit hook（lefthook `staged-task-dir-guard` 等）で block された場合: 該当ファイルが本タスクのスコープか確認し、はみ出していれば除外
- pre-push hook（`coverage-guard` 等）で block された場合: skill markdown のみの変更のため coverage 影響なしを示すログを確認し、必要なら hook の merge-commit スキップ条件を確認
- `--no-verify` は使わない（CLAUDE.md 規定）
