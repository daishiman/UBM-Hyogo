# PR Template — task-worktree-environment-isolation

> **ユーザー承認後にのみ** 本テンプレートで PR を作成すること。Claude Code および各エージェントは、承認前に `git commit` / `git push` / `gh pr create` を実行してはならない。

> 準備状態: READY。blocked理由はユーザー承認未取得。local check は `change-summary.md` と `main.md` に記録済み。

---

## PR タイトル案

```
docs(workflows): worktree-environment-isolation タスク仕様書策定
```

---

## Summary

- worktree / tmux / shell state を分離するための設計・検証手順を `docs/30-workflows/task-worktree-environment-isolation/` に Phase 1〜13 の docs-only 仕様として確定した。
- skill symlink 撤去方針 / tmux session-scoped state / gwt-auto lock / NON_VISUAL evidence の 4 受け入れ条件すべてに設計と検証手段（EV-1〜EV-7）を紐付けた。
- 実装変更（`scripts/new-worktree.sh` 改修・tmux 設定・symlink 撤去操作）は含まず、後続実装タスクへ申し送る。

---

## Test plan

本 PR は **docs-only / NON_VISUAL** のため、ランタイムテストは実施しない。以下の docs 整合性のみを確認する。

- [ ] manual smoke: `outputs/phase-11/manual-smoke-log.md` 記載のコマンド列が docs だけで再現可能であること（実行は後続実装タスク）
- [ ] link 整合: `outputs/phase-11/link-checklist.md` のリンク・相対パスがすべて解決すること
- [ ] spec 網羅: `artifacts.json.outputs` と `docs/30-workflows/task-worktree-environment-isolation/outputs/**` の実ファイルが完全一致すること
- [ ] CLAUDE.md 不変条件 10 項目への違反がないこと（Phase 3 §3 確認済）
- [ ] acceptance_criteria 4 項目（AC-1〜AC-4）すべてに設計セクション・EV 番号が紐付いていること

---

## 関連 Issue / 横断依存

- 本タスク: `task-worktree-environment-isolation`（docs-only / spec_created / NON_VISUAL）
- 横断依存（`cross_task_order` 順）:
  1. `task-conflict-prevention-skill-state-redesign`（上位・完了前提）
  2. `task-git-hooks-lefthook-and-post-merge`（前段・skill symlink 検出 hook を申し送り）
  3. **task-worktree-environment-isolation（本 PR）**
  4. `task-github-governance-branch-protection`（後段）
  5. `task-claude-code-permissions-decisive-mode`（後段・`OP_*` unset ガイダンス連携）

---

## チェックリスト

- [ ] `artifacts.json` の `outputs` 定義と実ファイル（`outputs/phase-1/`〜`outputs/phase-13/`）が一致している
- [ ] 各 `phase-XX.md` の「成果物」セクションが `artifacts.json.phases[].outputs` と一致している
- [ ] CLAUDE.md の「重要な不変条件」7 項目および運用不変条件（`wrangler` 直叩き禁止 / 平文 `.env` 不可 / 承認なし PR 禁止）への違反がない
- [ ] docs-only / spec_created / NON_VISUAL の分類が全 Phase で崩れていない
- [ ] acceptance_criteria 4 項目に設計対応・検証手段が docs で紐付いている
- [ ] 横断依存タスクへの申し送りが Phase 3 レビューおよび Phase 12 派生未タスク検出に記載されている
- [ ] commit / push / PR 作成は **ユーザー承認後** に実施する（本 Phase 時点では未実施）

---

## 補足

- 実装系の最終選択（`flock` vs `mkdir` フォールバック、`.gitignore` 追記、既存 worktree 遡及適用）は Phase 5 ランブックで方針が確定しており、後続実装タスクで反映する。
- 本 PR のマージ後も、後続実装タスクが完了するまで現行 `scripts/new-worktree.sh` の挙動は変わらない（後方互換性保持）。
