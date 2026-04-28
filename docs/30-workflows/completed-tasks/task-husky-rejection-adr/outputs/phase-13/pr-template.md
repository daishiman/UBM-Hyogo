# Phase 13: pr-template.md

日付: 2026-04-28
状態: pending_user_approval（PR 作成は本仕様書では行わない）

## PR タイトル

```
docs(decisions): add ADR-0001 for git hook tool selection (lefthook over husky)
```

代替候補:

- `docs(adr): add ADR-0001 git hook tool selection`
- `docs(decisions): introduce doc/decisions and ADR-0001 lefthook adoption`

## PR 本文テンプレート

```markdown
## Summary

- `task-git-hooks-lefthook-and-post-merge` の Phase 2 design ADR-01 / Phase 3 review 第5節に分散していた
  「Git hook ツールに lefthook を採用、husky を不採用」という設計判断を、独立 ADR として
  `doc/decisions/0001-git-hook-tool-selection.md` に集約しました。
- ADR 集約場所として `doc/decisions/` を新設し、命名規約 `NNNN-<slug>.md` を README に明記しました。
- 派生元の Phase 2 design.md / Phase 3 review.md には ADR-0001 へのバックリンクを追記のみで追加し、
  既存記述は一切書き換えていません。
- docs-only / NON_VISUAL タスクで、コード変更は 0 件です。

## Why

- 将来 hook ツールの再評価（例: husky 移行検討、pre-commit 移行検討）が起きた際に、
  判断履歴 1 ファイルで追えるようにするため。
- workflow outputs に分散した状態だと「決定」「理由」「代替案」がそれぞれ別 Phase 成果物にあり、
  全体像を一度に把握しづらかったため。

## Changes

- 追加: `doc/decisions/0001-git-hook-tool-selection.md`（ADR 本文）
- 追加: `doc/decisions/README.md`（ADR 一覧 + 命名規約）
- 追記: `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md`（backlink 1 行）
- 追記: `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md`（backlink 1 行）
- 追加: `docs/30-workflows/completed-tasks/task-husky-rejection-adr/outputs/`（Phase 1〜13 のワークフロー成果物一式）

## Test plan

- [ ] `ls doc/decisions/0001-git-hook-tool-selection.md doc/decisions/README.md` で両ファイル存在確認
- [ ] `grep -E '^## (Status|Context|Decision|Consequences|Alternatives Considered|References)' doc/decisions/0001-git-hook-tool-selection.md` で必須 6 セクション確認
- [ ] `grep -E '^### [ABC]\.' doc/decisions/0001-git-hook-tool-selection.md` で Alternatives 3 サブ節確認
- [ ] 派生元 phase-2/design.md と phase-3/review.md の backlink を目視確認
- [ ] 相対パス `../../../../../../doc/decisions/0001-git-hook-tool-selection.md` が解決することを `test -f` で確認

## Related

- Closes / Refs: #139（CLOSED 済み）
- 派生元タスク: `task-git-hooks-lefthook-and-post-merge`
- 関連未タスク: ADR テンプレート標準化（A-1, 本タスクの phase-12/unassigned-task-detection.md 参照）

## Reviewer

solo 開発のため必須レビュアーなし（CI gate / 線形履歴 / 会話解決必須化で品質担保）。
```

## チェックリスト

- [ ] CI（`required_status_checks`）が PASS
- [ ] 線形履歴（rebase merge）
- [ ] 会話の resolve
- [ ] main / dev 直 commit ガード（lefthook + branch protection）が機能している

## 注記

本 PR は **pending_user_approval** 状態。ユーザーの明示的な承認なしに `git add` / `git commit` /
`git push` / `gh pr create` は実行しない。
