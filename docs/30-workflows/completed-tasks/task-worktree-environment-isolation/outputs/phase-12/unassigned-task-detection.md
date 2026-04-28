# Unassigned Task Detection — task-worktree-environment-isolation

本タスクの作業中に発見された **本タスクのスコープ外** だが対応が必要な派生タスクを列挙し、`docs/30-workflows/unassigned-task/` への登録案として整理する。

---

## 1. 検出された派生タスク

### 1.1 UT-A: skill symlink を pre-commit で検出する lefthook hook

| 項目 | 内容 |
| --- | --- |
| 検出元 | Phase 2 §7 リスク表、Phase 3 §6 申し送り |
| 担当先候補 | `task-git-hooks-lefthook-and-post-merge` |
| スコープ理由 | 本タスクは「方針の docs 化」までが責務。pre-commit hook 実装は git-hooks タスクの責務 |
| 推奨実装概要 | `lefthook.yml` の `pre-commit` に `find .claude/skills -maxdepth 3 -type l` を組み込み、検出時は exit 1。CI でも同等チェックを回す |
| 受け入れ条件案 | (a) ローカル commit 時に skill symlink があれば commit 失敗 (b) CI で同様に失敗 (c) 既存 worktree への遡及検証コマンドが docs 化 |

### 1.2 UT-B: `scripts/new-worktree.sh` の実改修（lock + shell reset + tmux opt-in）

| 項目 | 内容 |
| --- | --- |
| 検出元 | 本タスク Phase 5 ランブック、Phase 12 implementation-guide §2.3 |
| 担当先候補 | 新規タスク `task-new-worktree-script-hardening`（仮）|
| スコープ理由 | 本タスクは docs-only。スクリプト実装は別タスクが必要 |
| 推奨実装概要 | implementation-guide §2.3 の差分マップをそのまま実装。EV-4, EV-5, EV-7 を CI または手動 smoke で取得 |
| 受け入れ条件案 | (a) `bash scripts/new-worktree.sh feat/foo` 後方互換 (b) 同名並列で後発 exit 75 (c) `--with-tmux` opt-in (d) `--audit` で symlink インベントリ出力 |

### 1.3 UT-C: aiworkflow-requirements `references/` への追記反映

| 項目 | 内容 |
| --- | --- |
| 検出元 | 本タスク `system-spec-update-summary.md` |
| 担当先候補 | aiworkflow-requirements skill メンテ枠（既存運用フロー） |
| スコープ理由 | skill references の更新は専用フロー（`update_references` 等）に従う必要があり、本タスクの単発 PR には含めない |
| 推奨実装概要 | `system-spec-update-summary.md` §1〜§3 の追記指示をそのまま反映 |
| 受け入れ条件案 | (a) `keywords` / `topic-map` / `quick-reference` に新項目が追加 (b) `lessons-learned-health-policy-worktree-2026-04.md` 末尾に 3 教訓追記 |

### 1.4 UT-D: tmux 設定テンプレートの配布手段確定

| 項目 | 内容 |
| --- | --- |
| 検出元 | Phase 2 §2.3、本タスクは設定スニペットの docs 化のみ |
| 担当先候補 | `task-claude-code-permissions-decisive-mode` 内の dev-environment 派生 or 新規タスク |
| スコープ理由 | `~/.tmux.conf` は開発者個人ファイルでありリポジトリ管理外。配布手段（dotfiles リポジトリへの誘導 / docs テンプレ提示のみ等）を別途決定する必要がある |
| 推奨実装概要 | `update-environment` 最小化スニペットを CLAUDE.md または `docs/00-getting-started-manual/` にテンプレ掲載 |

---

## 2. `docs/30-workflows/unassigned-task/` への登録案

### 2.1 登録テンプレート（UT-A の例）

```yaml
# docs/30-workflows/unassigned-task/UT-A-skill-symlink-pre-commit.yaml（仮想）
id: UT-A
title: skill symlink を pre-commit で検出する lefthook hook
detected_in: task-worktree-environment-isolation / Phase 2 §7, Phase 3 §6
candidate_owner: task-git-hooks-lefthook-and-post-merge
scope_reason: 本タスクは docs-only。hook 実装は git-hooks タスク責務。
acceptance_criteria:
  - ローカル commit 時に skill symlink があれば commit 失敗
  - CI で同等チェックが失敗する
  - 既存 worktree への遡及検証コマンドが docs 化されている
status: detected
```

UT-B / UT-C / UT-D も同形式で登録する。

### 2.2 登録タイミング

- Phase 13 承認後、`docs/30-workflows/unassigned-task/` 配下に 4 件分のエントリを別 PR で追加。
- 本 Phase では **検出と内容固定のみ**。

---

## 3. 検出されなかった領域（参考）

| 観点 | 結論 |
| --- | --- |
| Cloudflare 系（Workers / D1） | 本タスクと無関係。新規タスク不要 |
| 認証 / Auth.js | 関係なし |
| Google Form schema | 関係なし |
| GitHub Actions | UT-A が CI 連携のため間接的に影響するが、独立タスクは不要 |

---

## 4. 集計

| 派生タスク数 | 4 件（UT-A〜UT-D） |
| --- | --- |
| 即時新規タスク化 | UT-B（`task-new-worktree-script-hardening`） |
| 既存タスクへの申し送り | UT-A（lefthook）、UT-D（permissions or 新規） |
| skill メンテ枠 | UT-C（aiworkflow-requirements references） |
