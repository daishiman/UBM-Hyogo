# Phase 13: 完了確認 — task-worktree-environment-isolation

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 13（完了確認） |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| 状態 | **ユーザー承認待ち（user_approval_required: true）** |

---

## 1. Phase 13 サマリ

本タスクは `docs/30-workflows/task-worktree-environment-isolation/` 配下に Phase 1〜12 の仕様を docs-only で確定させ、worktree / tmux / shell state 分離の設計と検証手順（NON_VISUAL evidence）を docs として固定するものである。Phase 13 では以下を行う。

1. Phase 1〜12 の成果物が `artifacts.json` の `outputs` 定義と完全一致することを確認する。
2. acceptance_criteria 4 項目（skill symlink 撤去方針 / tmux session-scoped state / gwt-auto lock / NON_VISUAL evidence）の達成状況をまとめる。
3. 変更サマリと PR テンプレートを用意し、**ユーザー承認後にのみ** commit / push / PR 作成を行えるようにする。

本 Phase は **コード実装を含まない**。`scripts/new-worktree.sh` の改修や tmux 設定・skill symlink の撤去操作は、後続実装タスク（および横断依存タスク群）で別途扱う。

---

## 2. 関連ドキュメント（本 Phase 成果物）

| ファイル | 内容 |
| --- | --- |
| [`change-summary.md`](./change-summary.md) | 変更サマリ・受け入れ条件達成状況・横断依存・影響範囲 |
| [`pr-template.md`](./pr-template.md) | PR タイトル / Summary / Test plan / 関連 Issue / チェックリスト |

---

## 3. 完了条件チェック

| 項目 | 状態 |
| --- | --- |
| 13 Phase が `artifacts.json` と一致して揃っている | OK |
| docs-only / spec_created / NON_VISUAL の分類が崩れていない | OK |
| 受け入れ条件 4 項目すべてに設計・検証手順が紐付いている | OK |
| 横断依存タスクへの申し送りが docs に明記されている | OK |
| ユーザー承認なしの commit / push / PR 作成を行っていない | OK |

---

## 4. Local Check

| 確認 | 結果 | メモ |
| --- | --- | --- |
| Phase 11 docs-only / NON_VISUAL 方針 | PASS | screenshot 不要、証跡3点で代替 |
| Phase 11 代替証跡 | PASS | `main.md` / `manual-smoke-log.md` / `link-checklist.md` |
| Phase 13 gate | BLOCKED | ユーザー承認なしの commit / push / PR 作成は禁止 |
| change summary | READY | `change-summary.md` 作成済み |
| PR template | READY | `pr-template.md` 作成済み、未実行 |

---

## 5. ユーザー承認待ち事項

以下は **ユーザー承認後にのみ** 実施する。Claude Code およびエージェントは、本 Phase の段階で自動実行してはならない。

- `git add` / `git commit`（commit message は `pr-template.md` の Summary を踏襲）
- `git push` によるリモート反映
- `gh pr create` による PR 作成（`pr-template.md` を本文として使用）

Blocked reason: ユーザーの明示承認が未取得のため。承認が下りるまで本タスクは `spec_created` のまま保持し、commit / push / PR 作成は行わない。

---

## 6. 次アクション（承認後）

1. `change-summary.md` に基づき変更ファイル一覧（`docs/30-workflows/task-worktree-environment-isolation/**`）をステージング。
2. `pr-template.md` の本文で PR を作成。
3. PR レビューは `dev` 向け 1 名 / `main` 向け 2 名（`CLAUDE.md` ブランチ戦略）に従う。
4. 後続実装タスクは横断依存順序（`cross_task_order`）に従って起票する。
