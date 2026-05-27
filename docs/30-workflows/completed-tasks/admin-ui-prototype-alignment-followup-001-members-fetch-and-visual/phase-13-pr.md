---
spec_classification: implementation_spec
state: spec_created
phase: 13
phase_name: PR 作成
---

# Phase 13 — PR 作成（user-gated）

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## 目的

CLAUDE.md「PR作成の完全自律フロー」に従い、ユーザー承認後に PR を作成する。

## 前提と入力

- PR base ブランチ = `dev`（既定）
- 作業ブランチ = `feat/admin-ui-prototype-alignment-followup-001-members-fetch-and-visual`
- Phase 5〜11 完了 + strict 7 完了

## 作業手順

1. `git fetch origin dev` → ローカル `dev` を fast-forward 同期
2. 作業ブランチに `dev` を merge（conflict は CLAUDE.md 既定方針で解消）
3. 品質検証 4 コマンド（順序固定）:
   - `mise exec -- pnpm install --force`
   - `mise exec -- pnpm typecheck`
   - `mise exec -- pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
4. `git status --porcelain` が空であること確認
5. `git diff dev...HEAD --name-only` で PR 対象ファイル列挙
6. `gh pr create --base dev --title "feat(admin-members): prototype alignment + ADMIN_FETCH_404 fix"` を HEREDOC body で実行
7. 結果 URL を最終レポートに含める

## 成果物

- PR URL
- `outputs/phase-13/pr-gate.md`

## 完了条件 (DoD)

- 4 コマンド全 green
- PR が `dev` を base に作成され、本文に Phase 11 evidence 参照 + AC 達成状況が含まれる

## 検証コマンド

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
gh pr create --base dev --title "..." --body "..."
```

## 想定リスク

- `bash scripts/verify-pr-ready.sh` 失敗 → `pr-pre-flight-ci-gate-checklist.md` §1-§5 で切り分け

## ロールバック

- PR を draft 化 / close。`git push -f` は禁止

## 関連 spec

- `phase-12-documentation.md`
- CLAUDE.md「PR作成の完全自律フロー」
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
