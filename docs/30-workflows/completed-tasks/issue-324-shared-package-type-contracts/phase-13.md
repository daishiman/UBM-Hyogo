# Phase 13: リリース / PR 作成

[実装区分: 実装仕様書]

> **状態: blocked_pending_user_approval**
> 本 Phase は user 明示承認後に実行する。Claude Code 側で commit / push / PR を自動作成しない。

## 目的

Phase 05..10 の変更ファイルを 1 PR にまとめ、`dev` を base として PR を作成する準備を整える。

## 入力

- `packages/shared/src/__tests__/type-contracts.spec.ts`（Phase 05）
- `outputs/phase-06/`..`outputs/phase-12/` 配下の evidence 群
- `docs/30-workflows/completed-tasks/UT-08A-05-shared-package-type-test.md`（Phase 10 移動結果）
- `docs/30-workflows/08a-.../outputs/phase-12/unassigned-task-detection.md`（back-link 追記）
- `docs/30-workflows/issue-324-shared-package-type-contracts/`（本ワークフロー全体）

## ブランチ

| 項目 | 値 |
| --- | --- |
| base | `dev` |
| head | `feat/issue-324-shared-type-contracts`（user 承認時に `bash scripts/new-worktree.sh` で作成済の前提） |

## PR title 案

`feat(shared): add compile-time type contract tests for brand & view-model (Refs #324)`

## PR body 雛形

```markdown
## Summary
- packages/shared に compile-time 型契約テスト（vitest expectTypeOf + @ts-expect-error）を追加
- AC-1..AC-5（ResponseId/Email 排他 / view-model 必須 field 欠落 / zod input/output parity / public/admin schema 排他 / suite 独立性）をカバー
- 元 UT-08A-05 spec を completed-tasks/ へ移動

## Scope
- 新規: `packages/shared/src/__tests__/type-contracts.spec.ts`（5 describe / 15 it / 2 @ts-expect-error）
- 移動: source UT-08A-05 spec → `docs/30-workflows/completed-tasks/UT-08A-05-shared-package-type-test.md`
- 追記: 08a unassigned-task-detection.md §5 back-link

## Out of scope
- runtime コード変更（packages/shared は型 import のみ）
- `apps/api` / `apps/web` 改変
- `tsd` / vitest typecheck mode 導入

## Test plan
- [ ] `mise exec -- pnpm typecheck`（`Unused @ts-expect-error directive` 0）
- [ ] `mise exec -- pnpm lint`
- [x] `mise exec -- pnpm --filter @ubm-hyogo/shared test`（+15 件 PASS）
- [ ] `mise exec -- pnpm test`（apps/api 442 件 regression なし）

Refs: #324
```

## 手順（user 承認後）

| # | 操作 | コマンド |
| --- | --- | --- |
| 1 | base 同期 | `git fetch origin dev && git rebase origin/dev` |
| 2 | 全変更 add | `git add packages/shared/src/__tests__/type-contracts.spec.ts docs/30-workflows/` |
| 3 | commit | `git commit -m "feat(shared): add compile-time type contract tests (Refs #324)"` |
| 4 | push | `git push -u origin feat/issue-324-shared-type-contracts` |
| 5 | PR 作成 | `gh pr create --base dev --title "..." --body "..."` |

## 出力

- PR URL（user に返す）
- `outputs/phase-13/pr-url.txt`

## 完了条件 (DoD)

- [ ] user が明示承認（「PR 作成して」等）した
- [ ] CI required check（typecheck / lint / test）が PR で全 PASS
- [ ] Issue #324 に PR への back-link コメント追加

## リスクと対策

| リスク | 対策 |
| --- | --- |
| user 承認前に自動 commit/push される | 本 Phase status を `blocked_pending_user_approval` で固定 |
| `dev` リベース時にコンフリクト | 本タスクは新規 1 ファイル + docs 移動のみで衝突可能性低。発生時は CLAUDE.md「PR 作成の完全自律フロー」§コンフリクト解消方針に従う |
| Issue #324 が既に CLOSED で confusion | PR body に「CLOSED 表記だったが AC 5 件未充足のため再対応」を明示 |
