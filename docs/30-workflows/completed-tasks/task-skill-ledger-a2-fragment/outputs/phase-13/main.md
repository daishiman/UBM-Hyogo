# Phase 13 — 完了確認 / PR main

## ステータス: ⏳ ユーザー承認待ち

`git commit` / `git push` / `gh pr create` は **本ファイル末尾の手順をユーザーが明示的に承認した後にのみ** 実行する。

## Phase 1〜12 ステータス

| Phase | 名称 | ステータス |
| ----- | ---- | ---------- |
| 1 | 要件定義 | completed |
| 2 | 設計 | completed |
| 3 | 設計レビュー | completed（GO） |
| 4 | テスト設計 | completed |
| 5 | 実装ランブック | completed |
| 6 | テスト拡充 | completed |
| 7 | カバレッジ確認 | completed |
| 8 | リファクタリング | completed |
| 9 | 品質保証 | completed（13/13 PASS） |
| 10 | 最終レビュー | completed（GO） |
| 11 | 手動テスト | completed（4 worktree smoke は UT-A2-SMOKE-001） |
| 12 | ドキュメント更新 | completed（5 必須タスクすべて完了） |
| 13 | 完了確認 / PR | **pending — ユーザー承認待ち** |

## Acceptance Criteria 最終確認

[`../phase-10/go-no-go.md`](../phase-10/go-no-go.md) を参照。

| AC | 結果 |
| -- | ---- |
| AC-1 fragment 受け皿 | PASS |
| AC-2 legacy 退避 | PASS |
| AC-3 writer 切替 | PASS |
| AC-4 render 降順 | PASS |
| AC-5 fail-fast | PASS |
| AC-6 `--out` 拒否 | PASS |
| AC-7 `--include-legacy` 30 日 | PASS |
| AC-8 4 worktree smoke | 計画固定（後続 implementation で実機） |

## ユーザー承認後に実施する操作

```bash
# 1. 変更ファイルの確認
git status
git diff --stat

# 2. 段階的 add（センシティブファイル混入防止）
git add docs/30-workflows/task-skill-ledger-a2-fragment/
git add scripts/skill-logs-render.ts scripts/skill-logs-render.test.ts
git add scripts/skill-logs-append.ts scripts/skill-logs-append.test.ts
git add scripts/lib/branch-escape.ts scripts/lib/fragment-path.ts
git add scripts/lib/front-matter.ts scripts/lib/retry-on-collision.ts
git add scripts/lib/timestamp.ts
git add .claude/skills/*/LOGS/.gitkeep
git add .claude/skills/*/changelog/.gitkeep
git add .claude/skills/*/lessons-learned/.gitkeep
git add .claude/skills/*/LOGS/_legacy.md
git add .claude/skills/*/changelog/_legacy.md
git add '.claude/skills/*/lessons-learned/_legacy-*.md'
git add package.json pnpm-lock.yaml vitest.config.ts

# 3. commit（HEREDOC 形式 / Co-Authored-By 必須）
git commit -m "$(cat <<'EOF'
feat(skill): introduce skill ledger fragment system (A-2)

13-Phase spec at docs/30-workflows/task-skill-ledger-a2-fragment.
Implements pnpm skill:logs:{render,append}, legacy migration of 92 files,
and 15 vitest tests.

Refs: #130

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4. push（branch protection 設定確認後）
git push -u origin feat/issue-130-skill-ledger-a2-fragment-task-spec

# 5. PR 作成（pr-template.md の本文を使用）
gh pr create --title "feat(skill): A-2 skill ledger fragment system" \
  --body "$(cat docs/30-workflows/task-skill-ledger-a2-fragment/outputs/phase-13/pr-template.md)"
```

## 関連成果物

- [`change-summary.md`](./change-summary.md)
- [`pr-template.md`](./pr-template.md)
- [`../phase-12/implementation-guide.md`](../phase-12/implementation-guide.md)（PR 本文ソース）

## 重要ルール

- ❌ ユーザー承認なしに `git commit` / `git push` / `gh pr create` を実行しない
- ❌ Issue #130 を再オープンしない（CLOSED のまま）
- ❌ `wrangler` を直接呼ばない（`scripts/cf.sh` 経由のみ）
- ❌ `.env` の中身を表示・読み取らない
- ✅ 準備のみで完了
