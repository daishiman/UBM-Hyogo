# Phase 11: link-checklist（内部リンク dead link 検証）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase | 11 / 13 |
| 作成日 | 2026-04-28 |
| 検査範囲 | 本タスク `index.md` / `phase-01.md`〜`phase-13.md` / `outputs/**` および本タスク外の参照 |
| 判定 | MISSING が 1 件でもあれば Phase 11 fail。0 件で PASS |

## 検査結果サマリ

| 集計項目 | 件数 |
| --- | --- |
| 検査総数 | 17 |
| OK | 17 |
| MISSING | 0 |
| 総合判定 | **PASS**（dead link なし） |

## 検査詳細

| 参照元 | 参照先 | 種別 | 存在確認 |
| --- | --- | --- | --- |
| index.md | phase-01.md | 内部 (本タスク内) | OK |
| index.md | phase-02.md | 内部 (本タスク内) | OK |
| index.md | phase-03.md | 内部 (本タスク内) | OK |
| index.md | phase-04.md | 内部 (本タスク内) | OK |
| index.md | phase-05.md | 内部 (本タスク内) | OK |
| index.md | phase-06.md | 内部 (本タスク内) | OK |
| index.md | phase-07.md | 内部 (本タスク内) | OK |
| index.md | phase-08.md | 内部 (本タスク内) | OK |
| index.md | phase-09.md | 内部 (本タスク内) | OK |
| index.md | phase-10.md | 内部 (本タスク内) | OK |
| index.md | phase-11.md | 内部 (本タスク内) | OK |
| index.md | phase-12.md | 内部 (本タスク内) | OK |
| index.md | phase-13.md | 内部 (本タスク内) | OK |
| index.md / phase-12.md | doc/00-getting-started-manual/lefthook-operations.md | 外部（本リポ正本仕様） | OK |
| index.md | docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/implementation-guide.md | 外部（派生元タスク） | OK |
| index.md | docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md | 外部（派生元 baseline） | OK |
| phase-02.md / phase-12.md | scripts/new-worktree.sh および lefthook.yml | 外部（正本ファイル） | OK |

## 検査手順（再現可能性のため明記）

```bash
REPO=/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170623-wt-6
TASK_DIR="$REPO/docs/30-workflows/task-lefthook-multi-worktree-reinstall-runbook"

# 本タスク内 phase-*.md / index.md
ls "$TASK_DIR"/index.md "$TASK_DIR"/phase-{01..13}.md

# 外部参照
ls "$REPO/doc/00-getting-started-manual/lefthook-operations.md"
ls "$REPO/docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/implementation-guide.md"
ls "$REPO/docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md"
ls "$REPO/scripts/new-worktree.sh" "$REPO/lefthook.yml"
```

> 上記コマンドは Phase 11 の link 検証で **既に実行済み**（環境依存のため再実行は任意）。
> 全パスが OK で、dead link は 0 件であった。

## Phase 12 への引き渡し

- 本 link-checklist の **PASS** 判定を `system-spec-update-summary.md` から証跡として参照する。
- 将来 `lefthook-operations.md` の内容変更や派生元タスクのパス変更があった場合は、
  本 checklist を再実行して整合を保つ。
