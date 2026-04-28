# Phase 11: リンク整合チェックリスト — task-worktree-environment-isolation

本ファイルは artifacts.json / 実ファイル / phase-XX.md / 外部参照（CLAUDE.md, scripts/new-worktree.sh）/ 関連タスク仕様書間の相互参照を最終照合するためのチェックリスト。

> 確認方法: 各項目を実行し、`[ ]` を `[x]` に更新する。実出力の貼付は不要だが、不一致があれば `備考` 欄に記載する。

---

## 1. artifacts.json の outputs と実ファイルの照合

`docs/30-workflows/task-worktree-environment-isolation/artifacts.json` の `phases[].outputs` と、実際に `outputs/` 配下に存在するファイルを完全照合する。

| Phase | 宣言された outputs | 実ファイル存在 | 備考 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-1/main.md` | [ ] | |
| 2 | `outputs/phase-2/main.md`, `outputs/phase-2/design.md` | [ ] / [ ] | |
| 3 | `outputs/phase-3/main.md`, `outputs/phase-3/review.md` | [ ] / [ ] | |
| 4 | `outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md` | [ ] / [ ] | |
| 5 | `outputs/phase-5/main.md`, `outputs/phase-5/runbook.md` | [ ] / [ ] | |
| 6 | `outputs/phase-6/main.md`, `outputs/phase-6/failure-cases.md` | [ ] / [ ] | |
| 7 | `outputs/phase-7/main.md`, `outputs/phase-7/coverage.md` | [ ] / [ ] | |
| 8 | `outputs/phase-8/main.md`, `outputs/phase-8/before-after.md` | [ ] / [ ] | |
| 9 | `outputs/phase-9/main.md`, `outputs/phase-9/quality-gate.md` | [ ] / [ ] | |
| 10 | `outputs/phase-10/main.md`, `outputs/phase-10/go-no-go.md` | [ ] / [ ] | |
| 11 | `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/link-checklist.md` | [ ] / [ ] / [ ] | |
| 12 | `outputs/phase-12/main.md`, `outputs/phase-12/implementation-guide.md`, `outputs/phase-12/system-spec-update-summary.md`, `outputs/phase-12/documentation-changelog.md`, `outputs/phase-12/unassigned-task-detection.md`, `outputs/phase-12/skill-feedback-report.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` | [ ] x7 | |
| 13 | `outputs/phase-13/main.md`, `outputs/phase-13/change-summary.md`, `outputs/phase-13/pr-template.md` | [ ] / [ ] / [ ] | |

検証コマンド例:

```bash
cd docs/30-workflows/task-worktree-environment-isolation
jq -r '.phases[].outputs[]' artifacts.json | sort -u > /tmp/expected.txt
find outputs -type f -name '*.md' | sed 's|^|docs/30-workflows/task-worktree-environment-isolation/|' | sort -u > /tmp/actual.txt
diff /tmp/expected.txt /tmp/actual.txt
```

---

## 2. phase-XX.md の参照整合

各 phase-XX.md の「成果物」セクションが artifacts.json と一致しているかを確認する。

| ファイル | 成果物セクション = artifacts.json outputs | 備考 |
| --- | --- | --- |
| `phase-01.md` | [ ] | |
| `phase-02.md` | [ ] | |
| `phase-03.md` | [ ] | |
| `phase-04.md` | [ ] | |
| `phase-05.md` | [ ] | |
| `phase-06.md` | [ ] | |
| `phase-07.md` | [ ] | |
| `phase-08.md` | [ ] | |
| `phase-09.md` | [ ] | |
| `phase-10.md` | [ ] | |
| `phase-11.md` | [ ] | |
| `phase-12.md` | [ ] | |
| `phase-13.md` | [ ] | |

加えて `index.md` の Phase 一覧表が `artifacts.json.phases` と一致していることも確認する: [ ]

---

## 3. CLAUDE.md / scripts/new-worktree.sh への参照

| 参照元 | 参照先 | 種別 | 確認 | 備考 |
| --- | --- | --- | --- | --- |
| `outputs/phase-1/main.md` §5 前提条件 | `CLAUDE.md` の「ワークツリー作成」「開発環境セットアップ」「Cloudflare 系 CLI 実行ルール」 | テキスト引用 | [ ] | |
| `outputs/phase-1/main.md` §5 | `scripts/new-worktree.sh`（lock 機構の現状） | 機能言及 | [ ] | |
| `outputs/phase-2/design.md` §5 | `scripts/new-worktree.sh`（改修方針） | 改修指示 | [ ] | |
| `outputs/phase-2/design.md` §4.1 | `CLAUDE.md` の `mise exec --` 運用 | 整合確認 | [ ] | |
| `outputs/phase-11/manual-smoke-log.md` EV-4/5 | `scripts/new-worktree.sh`（lock 動作確認） | 実行参照 | [ ] | |
| `phase-10.md`, `phase-11.md` 参照資料 | `CLAUDE.md`, `scripts/new-worktree.sh` | 明示引用 | [ ] | |
| `artifacts.json.specs_referenced` / `doc_references` | `CLAUDE.md`, `scripts/new-worktree.sh` | メタ宣言 | [ ] | |

---

## 4. 関連タスク仕様書間の相互参照

`artifacts.json.cross_task_order` 順での整合性。

| 関連タスク | 本タスク内の言及箇所 | 申し送り内容 | 確認 |
| --- | --- | --- | --- |
| `task-conflict-prevention-skill-state-redesign` | `outputs/phase-1/main.md` §8, `phase-3/review.md` §4, `phase-10/go-no-go.md` §3 | 上位完了前提 / skill 内部 state は上位で完結 | [ ] |
| `task-git-hooks-lefthook-and-post-merge` | `outputs/phase-2/design.md` §7 リスク表, `phase-3/review.md` §4-§6, `phase-10/go-no-go.md` §2 C-4 | pre-commit で `find .claude/skills -type l` を検出する案を申し送り | [ ] |
| `task-github-governance-branch-protection` | `outputs/phase-3/review.md` §4, `phase-10/go-no-go.md` §3 | 影響なし（lock は worktree-local） | [ ] |
| `task-claude-code-permissions-decisive-mode` | `outputs/phase-2/design.md` §4.2, `phase-3/review.md` §4, `phase-10/go-no-go.md` §3 | shell `OP_*` unset 推奨を申し送り | [ ] |

---

## 5. AC ↔ EV ↔ Phase の追跡可能性

| AC | 設計セクション | EV | manual-smoke-log セクション | 確認 |
| --- | --- | --- | --- | --- |
| AC-1 skill symlink 撤去 | design §1 | EV-1 | §2 | [ ] |
| AC-2 tmux session-scoped state | design §2 | EV-2, EV-3 | §3, §4 | [ ] |
| AC-3 gwt-auto lock | design §3, §5 | EV-4, EV-5 | §5, §6 | [ ] |
| AC-4 NON_VISUAL evidence | design §6 | EV-1〜EV-7 全体 | §2〜§8 | [ ] |
| 横断: shell state | design §4 | EV-7 | §8 | [ ] |

---

## 6. メタ整合（artifacts.json フィールド）

| フィールド | 期待値 | 確認 |
| --- | --- | --- |
| `task_name` | `task-worktree-environment-isolation` | [ ] |
| `execution_mode` | `spec_created` | [ ] |
| `metadata.taskType` | `docs-only` | [ ] |
| `metadata.docsOnly` | `true` | [ ] |
| `metadata.visualEvidence` | `NON_VISUAL` | [ ] |
| `metadata.workflow` | `spec_created` | [ ] |
| `phases[*].user_approval_required` | Phase 1〜12 が `false`、Phase 13 のみ `true` | [ ] |
| `acceptance_criteria` | 4 項目（AC-1〜AC-4 相当） | [ ] |

---

## 7. 不整合発見時の対応

- artifacts.json と実ファイルが一致しない場合: 実ファイル側を artifacts.json に合わせる（artifacts.json は契約として固定）。
- phase-XX.md の成果物セクションが artifacts.json と一致しない場合: phase-XX.md を修正。
- CLAUDE.md / scripts/new-worktree.sh の現状とドキュメントの記述が乖離した場合: Phase 12 で正本側を更新する旨を申し送り。

---

## 8. 完了条件

- [ ] §1〜§6 のチェック項目がすべて確認済み（または不一致が `備考` に記載されている）。
- [ ] §7 の不整合は本タスク内 or Phase 12 で解消する方針が決まっている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行っていない。
