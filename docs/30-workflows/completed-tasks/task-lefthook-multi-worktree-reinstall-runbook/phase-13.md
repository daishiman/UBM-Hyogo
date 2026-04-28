# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-28 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし（最終 Phase） |
| 状態 | **approval_required** |
| タスク分類 | docs-only / runbook-spec |

---

## 重要警告（冒頭・最上部に明示）

> **本 Phase は、ユーザーの明示承認なしでは実行してはならない。**
>
> 具体的には以下の操作は **全てユーザー承認後のみ** 実行可能:
>
> - `git add` / `git commit`
> - `git push`
> - `gh pr create`
> - 完了タスクの `completed-tasks/` への移動
>
> 承認が無い状態で本 Phase の手順を進めることは禁止。
> 仕様書の状態は `approval_required` のまま据え置き、ユーザーからの GO 指示を待つ。

---

## 目的

本タスクの全 Phase 1〜12 が PASS で揃った後、ユーザー承認を経て PR を作成する手順・テンプレート・
レビュー観点・マージ後の後片付け手順を仕様化する。

## 評価観点

| 観点 | 期待 |
| --- | --- |
| 承認ゲート | 承認確認なしで `git`/`gh` を一切叩かない |
| PR タイトル | 70 文字以内・docs スコープ明示 |
| PR 本文 | Summary / Test plan / 参照 Issue を含む |
| ブランチ戦略 | `feature/* → dev → main` を遵守（CLAUDE.md） |
| マージ後手順 | `completed-tasks/` 移動が specify 済み |

## 実行前提

| 前提 | 状態 |
| --- | --- |
| Phase 1〜10 の判定が PASS | 必須 |
| Phase 11 の `manual-smoke-log.md` / `link-checklist.md` が存在 | 必須 |
| Phase 12 の 5 種成果物が揃っている | 必須 |
| GitHub Issue #138 はクローズ済みのまま | OK（再オープンしない） |
| ユーザー承認 | **未取得（本仕様時点）** |

## Task 一覧

### Task 1: 承認確認（**必ず最初に実施**）

- ユーザーへ「Phase 13 を実行してよいか」を必ず確認する。
- 承認が得られなければ Task 2 以降に **進まない**。
- 承認文言は明示的な GO（例: 「PR 作って良い」「Phase 13 進めて」等）を必須とする。
  曖昧な返答（「いいかな」等）は再確認する。

### Task 2: PR タイトル・本文テンプレート

#### PR タイトル（70 文字以内）

```
docs(workflows): add lefthook multi-worktree reinstall runbook spec
```

#### PR 本文テンプレート

```markdown
## Summary
- 30+ worktree への lefthook 一括再インストール運用を runbook 仕様書として固定（docs-only）。
- `doc/00-getting-started-manual/lefthook-operations.md` への差分追記内容を Phase 12 で specify。
- Phase 3 代替案 A/B/C を `unassigned-task-detection.md` に baseline として記録。

## 関連 Issue
- Closes/Refs: #138 (CLOSED のままタスク仕様書を作成する方針に従い、再オープンはしない)

## 変更スコープ
- `docs/30-workflows/task-lefthook-multi-worktree-reinstall-runbook/` 配下のみ
- `doc/00-getting-started-manual/lefthook-operations.md` への差分追記は **本 PR には含めず**、
  実装 Wave の別 PR で適用する（本 PR は仕様書のみ）。

## Test plan
- [ ] `phase-01.md`〜`phase-13.md` がリンク切れなし（Phase 11 link-checklist.md 参照）
- [ ] Phase 12 必須 5 種が全て存在
- [ ] `screenshots/` ディレクトリが存在しないこと（NON_VISUAL）
- [ ] `manual-smoke-log.md` が ISO8601 注記を含む
- [ ] `unassigned-task-detection.md` に代替案 A/B/C が baseline 記録されている

## Notes
- 実機 dry-run（`scripts/reinstall-lefthook-all-worktrees.sh` 実装 + 30+ worktree への適用）は
  本 PR には含まない。次 Wave で実施する。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> 上記テンプレは **承認後** に `gh pr create --title ... --body "$(cat <<'EOF' ... EOF)"` で投入する。
> 承認前に Bash で実行してはならない。

### Task 3: ブランチ・コミット手順（承認後のみ）

CLAUDE.md のブランチ戦略 `feature/* → dev → main` を遵守する。

```bash
# 1. 現在ブランチの確認（feature/* 配下であること）
git branch --show-current

# 2. 変更ファイルを限定して add（ワイルドカード add 禁止）
git add docs/30-workflows/task-lefthook-multi-worktree-reinstall-runbook/

# 3. コミット（HEREDOC で正確に整形・hook をスキップしない）
git commit -m "$(cat <<'EOF'
docs(workflows): add lefthook multi-worktree reinstall runbook spec

30+ worktree への lefthook 一括再インストール運用を docs-only タスクとして
仕様書化。Phase 11 で manual-smoke-log の書式を、Phase 12 で
lefthook-operations.md への差分追記を specify。

Refs: #138

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4. push（base は dev。直接 main へ push しない）
git push -u origin <現在の feature ブランチ名>

# 5. PR 作成（base = dev）
gh pr create --base dev --title "..." --body "..."
```

> **再強調**: 上記すべてのコマンドは「ユーザー承認後のみ」実行可能。
> hook を `--no-verify` で skip するのは禁止。lefthook が落ちた場合は内容を直して再コミットする。

### Task 4: レビュー観点（自己チェック）

PR 投入前に以下を自己レビュー:

| 観点 | チェック |
| --- | --- |
| docs-only スコープを逸脱していないか | コードファイル変更ゼロを確認 |
| `screenshots/` が無いことを確認 | `ls outputs/phase-11/` で screenshots/ 不在 |
| Phase 12 5 種が揃っているか | `ls outputs/phase-12/` で 5 ファイル確認 |
| Issue #138 を再オープンしていないか | `gh issue view 138` で CLOSED のまま |
| `lefthook-operations.md` を本 PR で変更していないか | 変更は別 PR にする方針を遵守 |
| ブランチ base が `dev` か | `main` 直 push になっていない |

### Task 5: マージ後の completed-tasks 移動手順

マージ完了後（**ユーザー指示があってから**）以下を実行:

```bash
# 1. dev を最新化
git checkout dev && git pull --ff-only

# 2. completed-tasks へ移動
git mv docs/30-workflows/task-lefthook-multi-worktree-reinstall-runbook \
       docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook

# 3. artifacts.json の状態を completed に更新（手動編集）
#    - state: "completed"
#    - completedDate: "2026-04-28"

# 4. 移動コミット
git add docs/30-workflows/
git commit -m "$(cat <<'EOF'
chore(workflows): move task-lefthook-multi-worktree-reinstall-runbook to completed-tasks

Refs: #138

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 5. PR 経由でマージ（直 push 禁止）
git push -u origin <移動用ブランチ>
gh pr create --base dev --title "chore(workflows): mark lefthook reinstall runbook as completed" ...
```

> マージ後手順も **ユーザー承認後のみ** 実行可。本仕様書時点では実行しない。

## 完了条件

- ユーザー承認の取得が記録されている
- PR が `dev` 向けに作成され URL が報告されている
- 自己レビュー観点 6 項目を全て満たしている
- マージ後の `completed-tasks/` 移動手順が specify されている（実行は別タイミング）

## 参照

- CLAUDE.md「ブランチ戦略」セクション
- `doc/00-getting-started-manual/lefthook-operations.md`
- 派生元: `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/`
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/138

---

## 最終再強調

**ユーザーの明示 GO が無い限り、本 Phase の `git` / `gh` コマンドは一切実行しない。**
仕様書状態は `approval_required` のまま据え置き、Phase 12 までの成果物を以て
レビュー可能な状態で待機する。
