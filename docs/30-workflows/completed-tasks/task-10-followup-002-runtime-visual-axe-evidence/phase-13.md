# Phase 13: ユーザーゲート PR

[実装区分: 実装仕様書]

## 目的

User の明示指示があった時点で PR を作成する。Phase 12 までは PR 作成・push を行わない（CONST_002）。

## 前提

- Phase 1-12 すべて完了
- evidence ledger 更新済み
- 親 spec `task-10-ui-primitives-spec/outputs/phase-11/main.md` 更新済み

## PR 作成手順（user 指示後のみ実行）

CLAUDE.md「PR作成の完全自律フロー」に従い、base = `dev`、branch = `feat/issue-610-task-10-followup-002`。

```bash
git fetch origin dev
git merge origin/dev
# コンフリクトがあれば CLAUDE.md 既定方針で解消
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
gh pr create --base dev --title "feat(task-10-followup-002): UI primitives runtime visual + axe evidence" \
  --body "$(cat outputs/phase-12/implementation-guide.md)"
```

## issue リンク

issue #610 は closed のまま維持する。PR description に "Refs #610（closed）— evidence capture follow-through" と明記する。

evidence が main / dev に取り込まれる- [ ] PR が作成され URL が user に返却される
- [ ] evidence が main / dev に取り込まれる

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| workflow | task-10-followup-002-runtime-visual-axe-evidence |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| state | runtime_pending |

## 実行タスク

- [ ] 本 Phase の本文に記載した task を実行する。
- [ ] 実行結果を該当 outputs path に保存する。
- [ ] runtime 未実行のものは completed と書かず runtime_pending と記録する。

## 参照資料

| 参照 | パス |
| --- | --- |
| workflow root | docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/ |
| parent workflow | docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/ |
| UI canonical | .claude/skills/aiworkflow-requirements/references/ui-ux-components.md |
| state vocabulary | .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md |

## 成果物/実行手順

| 成果物 | 手順 |
| --- | --- |
| Phase output | 本文の command / checklist に従い outputs 配下へ保存する |
| Evidence | Phase 11 runtime 実行までは runtime_pending とする |

## 統合テスト連携

| 項目 | 値 |
| --- | --- |
| focused e2e | PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002 pnpm --filter @ubm-hyogo/web e2e --project=desktop-chromium ui-primitives-visual.spec.ts |
| local gates | typecheck / lint / token gate / artifacts parity |
| external gates | staging deploy / production smoke / commit / push / PR は user-gated |

## 完了条件チェックリスト

- [ ] 必須成果物 path が存在する。
- [ ] 状態語彙が canonical である。
- [ ] 未実行 runtime evidence を completed と表記していない。
