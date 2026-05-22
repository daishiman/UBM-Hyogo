---
phase: 13
title: commit / PR 作成
workflow_id: parallel-i06-root-error-focus
status: blocked_pending_user_approval
---

# Phase 13 — commit / PR

[実装区分: 実装仕様書]

> **重要**: Phase 13（commit / push / PR 作成）は **ユーザーの明示承認後** にのみ実行する。
> 本タスク仕様書作成サイクル内では Phase 13 を実行しない（CLAUDE.md PR 自律フロー § 既定方針）。

## 1. 事前確認

- [ ] Phase 1〜12 が全て `completed` で完了している
- [ ] `bash scripts/verify-pr-ready.sh` が exit 0
- [ ] `git status --porcelain` が想定スコープ内のみ（`apps/web/app/error.tsx` / `apps/web/app/error.spec.tsx` / `docs/30-workflows/parallel-i06-root-error-focus/**`）

## 2. ブランチ運用

CLAUDE.md「PR 作成の完全自律フロー」に従う:

- base branch: **`dev`**（既定）
- 作業ブランチ: `feat/root-error-focus-management`（未作成の場合は本 Phase で作成）
- production リリース時のみ別途 `dev → main` PR を発行

## 3. commit 手順

```bash
git add apps/web/app/error.tsx apps/web/app/error.spec.tsx \
        docs/30-workflows/parallel-i06-root-error-focus

git commit -m "$(cat <<'EOF'
feat(a11y): root error.tsx で h1 自動 focus を実装

parallel-07 spec section 4.3 の DoD を充足し、error boundary catch 時に
screen reader が見出しを最初に読み上げるよう programmatic focus を移譲する。

- apps/web/app/error.tsx: useRef + useEffect で h1 へ focus 移譲（4 行差分）
- apps/web/app/error.spec.tsx: focus 移譲 + digest 表示の 2 ケース

Refs: docs/30-workflows/parallel-i06-root-error-focus/

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

## 4. push と PR 作成

```bash
git push -u origin feat/root-error-focus-management

gh pr create --base dev --title "feat(a11y): root error.tsx で h1 自動 focus を実装" --body "$(cat <<'EOF'
## Summary
- root `apps/web/app/error.tsx` で error boundary catch 時に h1 へ自動 focus を移譲
- `preventScroll: true` で scroll jump を抑制
- `apps/web/app/error.spec.tsx` に focus 移譲 + digest 表示の 2 ケースを追加
- 差分量: コード 4 行 + test 1 ファイル + Phase 1-13 仕様書

## Test plan
- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm -F "@ubm-hyogo/web" exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/error.spec.tsx` 2 PASS
- [x] HEX literal grep 0 件
- [x] arbitrary color class grep 0 件
- [x] `parallel-07` spec section 4.3 DoD 達成

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 5. PR 後の運用

- CI（`verify-test-suffix` / `verify-design-tokens` / `verify-phase12-compliance`）が green になったら merge 可能
- merge 後、本 workflow root を `docs/30-workflows/completed-tasks/parallel-i06-root-error-focus/` へ移動するか、source spec（`ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/`）配下に統合するかを判断する
- source spec の `status: pending` を `consumed` に更新し、`canonical_workflow: docs/30-workflows/parallel-i06-root-error-focus/` のポインタを追記する

## 6. 禁則

- `--no-verify` 禁止
- force-push 禁止（特に `dev` / `main` ブランチ）
- ユーザー承認なしの本 Phase 実行禁止
