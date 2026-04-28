# System Spec Update Summary — task-worktree-environment-isolation

`.claude/skills/aiworkflow-requirements/` の `references/` 配下に、本タスクで確定した worktree / tmux / shell / lock 仕様を追記した記録。

---

## 1. 追記対象 references

| ファイル | 追記箇所 | 追記内容（要旨） |
| --- | --- | --- |
| `references/development-guidelines-core.md` | `Worktree 入場時の環境分離` 節 | worktree 入場時の必須テンプレ（`unset OP_SERVICE_ACCOUNT_TOKEN`, `hash -r`, `mise trust/install`, `mise exec --`）を追記済み |
| `references/development-guidelines-details.md` | `並列 worktree 運用` 節 | D-1〜D-4 の契約 + EV-1〜EV-7 系の証跡対応を追記済み |
| `references/lessons-learned-health-policy-worktree-2026-04.md` | 末尾「task-worktree-environment-isolation 教訓」 | skill symlink 撤去・tmux global env リーク・gwt-auto lock の 3 教訓を追記済み |
| `references/task-workflow-active.md` | `Current Active / Spec Created Tasks` | `task-worktree-environment-isolation` を spec_created / docs-only / NON_VISUAL として登録済み |
| `references/task-workflow-backlog.md` | `task-worktree-environment-isolation follow-up` | 後続実装 4 件を backlog 登録済み |

---

## 2. keywords / topic-map への追記項目

### 2.1 keywords

新規追加:

- `worktree-isolation`
- `tmux-session-scoped-env`
- `gwt-auto-lock`
- `skill-symlink-removal`
- `mise-shell-state-reset`

### 2.2 topic-map

新規 topic と参照誘導:

| topic | 関連 references | 関連タスク |
| --- | --- | --- |
| `developer-environment / worktree-isolation` | `development-guidelines-core.md` / `development-guidelines-details.md` / `lessons-learned-health-policy-worktree-2026-04.md` | `task-worktree-environment-isolation` |
| `developer-environment / tmux-session-state` | `development-guidelines-details.md` | 同上 |
| `developer-environment / lock-strategy` | `development-guidelines-details.md` | 同上 + `task-git-hooks-lefthook-and-post-merge`（pre-commit 連携） |

### 2.3 quick-reference

「ワークツリー作成・運用」項に以下リンクを追加:

- 本タスク `outputs/phase-12/implementation-guide.md` Part 2 §2.3
- 本タスク `outputs/phase-2/design.md` §3（gwt-auto lock）
- 本タスク `outputs/phase-2/design.md` §6（NON_VISUAL evidence EV-1〜EV-7）

---

## 3. resource-map への影響

`indexes/resource-map.md` の「Developer Experience / Local Tooling」導線は自動生成対象のため、`topic-map.md` 再生成で同期する。Progressive Disclosure を崩さないため、トップレベルから 2 ホップ以内に到達できる位置に配置する。

---

## 4. 既存 reference との衝突有無

Phase 3 §2 で確認済み。aiworkflow-requirements 用語規範（worktree / session-scoped / lock / symlink）と本タスク用語に齟齬なし。追記は **拡張のみで既存記述の改変なし**。

---

## 5. 反映タイミング

- 本 Phase で references 反映まで完了。
- Phase 13 はユーザー承認待ちであり、commit / PR は行わない。
