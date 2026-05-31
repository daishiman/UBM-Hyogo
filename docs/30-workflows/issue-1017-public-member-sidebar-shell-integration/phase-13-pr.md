---
Phase: 13
status: pending_user_approval
task_id: issue-1017-public-member-sidebar-shell-integration
implementation_mode: verify_existing
---

`[実装区分: 実装仕様書]`

# Phase 13: commit / PR / release（issue-1017, verify_existing）

## 状態

`pending_user_approval`。

実装本体 PR **#1028（commit `278001606`）は既に dev へマージ済み**（2026-05-31）。
したがって本 Phase で扱うのは **本仕様書 docs の commit / push / PR のみ**であり、
これらは **user 明示承認後にのみ実行**する（Gate-C）。

## 重要な区別

| 対象 | 状態 |
|------|------|
| Task C 実装コード（layout 統合 + 旧 header 撤去 + route group 移行） | **PR #1028 で landed 済み**（再実装しない） |
| 本仕様書 docs（`docs/30-workflows/issue-1017-...`） | commit/PR 未実施・**user-gated** |

## commit / PR 計画（承認後）

- **base ブランチ**: `dev`
- **commit 対象**: `docs/30-workflows/issue-1017-public-member-sidebar-shell-integration/` 配下のみ
- **apps/ 変更**: なし（`git status apps/` が空であることを commit 前に確認）
- **PR 本文**: 本 verify_existing 仕様書が #1028 の landed 実装を正本固定した旨、受け入れ条件 4/4 MET、新規未タスク 0 件を記載。実装 PR #1028 を Refs として参照

## 承認後の実行順序

1. `git status apps/` が空であることを確認（apps/ への混入なし）
2. 作業ブランチで `docs/30-workflows/issue-1017-...` のみ `git add`
3. commit メッセージに `Refs #1017` / `Refs #1028` を含める
4. `pnpm verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を pre-flight 確認
5. `git push` → `gh pr create --base dev`

## 検証コマンド（docs gate）

```bash
pnpm verify:phase12-compliance
pnpm gate-metadata:validate --require-gates-for-changed \
  docs/30-workflows/issue-1017-public-member-sidebar-shell-integration/artifacts.json \
  docs/30-workflows/issue-1017-public-member-sidebar-shell-integration/outputs/artifacts.json
```

## 結果

`outputs/phase-13/pr-creation-result.md` を参照（status: pending_user_approval）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1017-public-member-sidebar-shell-integration |
| Phase | 13 |
| mode | verify_existing |

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 13 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 13 記録を正本として維持する。
- #1028 の landed 実装と本 Phase の境界を確認する。

## 参照資料

- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-C-public-and-member-layout-integration.md`
- `docs/30-workflows/task-c-public-member-sidebar-shell-integration/`
- commit `278001606` / PR #1028

## 成果物

- 本ファイル
- `artifacts.json` / `outputs/artifacts.json` parity
- Phase 11/12 outputs

## 完了条件

- [x] Phase 13 の判断・証跡が本文に記録されている。
- [x] task-specification-creator の必須見出しを満たす。
