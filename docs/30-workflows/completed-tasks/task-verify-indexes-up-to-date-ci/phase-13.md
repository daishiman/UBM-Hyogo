# Phase 13: PR 作成（ユーザー承認待ち）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase | 13 |
| 状態 | pending_user_approval |
| ユーザー承認 | 必須 |
| 禁止事項 | 承認前の commit / push / PR 作成 |

## 目的

Phase 1〜12 で完了した CI gate 実装と仕様同期を、ユーザー承認後に PR 化する。
本 phase は指示書であり、作業者はユーザーの明示承認なしに Git 操作を実行しない。

## 実行タスク

1. PR 範囲の最終確認を行う。
2. 承認後チェックコマンドを実行する。
3. ユーザー承認後にのみ commit / push / PR 作成を行う。
4. GitHub Actions 実機 run を確認する。

## PR 範囲

| 分類 | 対象 |
| --- | --- |
| CI 実装 | `.github/workflows/verify-indexes.yml` |
| 運用 docs | `CLAUDE.md`, `doc/00-getting-started-manual/lefthook-operations.md` |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md`, LOGS, changelog, indexes |
| タスク成果物 | `docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci/` |
| 関連未タスク | lefthook 一括 reinstall runbook を同梱する場合は、その script / unassigned-task / backlog 更新 |

## 参照資料

| 種別 | パス |
| --- | --- |
| タスク index | `docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci/index.md` |
| 実装ガイド | `docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci/outputs/phase-12/implementation-guide.md` |
| CI workflow | `.github/workflows/verify-indexes.yml` |
| DevOps 正本 | `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md` |
| 元タスク | `docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci.md` |

## 成果物/実行手順

### 承認後チェック

```bash
git status --short
pnpm indexes:rebuild
git add -N .claude/skills/aiworkflow-requirements/indexes
git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes
bash -n scripts/reinstall-lefthook-all-worktrees.sh
actionlint .github/workflows/verify-indexes.yml
```

`actionlint` がローカルにない場合は未実行理由を PR 本文に書く。

### PR タイトル案

```text
ci(verify-indexes): aiworkflow-requirements indexes drift を CI で検出する
```

### PR 本文要約

- `verify-indexes-up-to-date` workflow を追加
- `pnpm indexes:rebuild` 後に `.claude/skills/aiworkflow-requirements/indexes` のみを diff
- drift 時は復旧コマンド付き error、`git status --short`、`git diff --name-status` を出力
- post-merge hook には index 再生成を戻さない
- Phase 11 は NON_VISUAL のためスクリーンショット不要。PR 後に GitHub Actions 実機 run を確認する

## 完了条件

- [x] Phase 1〜12 が completed である。
- [x] Phase 13 が pending_user_approval として分離されている。
- [ ] ユーザー承認後に commit / push / PR を実行する。
- [ ] PR 作成後に `verify-indexes-up-to-date` の実機 run を確認する。
