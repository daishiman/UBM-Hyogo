# Phase 13 — PR作成

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 名前 | PR作成 |
| 状態 | spec_created |
| 依存 | Phase 12 |
| 入力 | Phase 1-12 成果物 + 全コミット |
| 出力 | outputs/phase-13/pr-summary.md |

## 目的

CLAUDE.md「PR作成の完全自律フロー」に従い、commit / push / PR 作成を **ユーザー明示承認後** に実施する。
Gate-D (user_gated_pr) を通す。

## タスク

- [ ] ユーザーに最終承認を求める（Gate-D）
- [ ] `git fetch origin dev` → ローカル `dev` 同期
- [ ] 作業ブランチに戻り `git merge dev`（conflict は CLAUDE.md 既定方針で解消）
- [ ] `mise exec -- pnpm install --force`
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] 残未コミット変更を `git add -A` → commit
- [ ] `git push -u origin <branch>`
- [ ] `gh pr create --base dev` で PR 作成
- [ ] `outputs/phase-13/pr-summary.md` に PR URL / 採用ブランチ / 自動修復 / 解消コンフリクト / 残課題を記録

## PR タイトル / base

- **base**: `dev`
- **title**: `feat(ut-07c-fu-001): meeting attendance CSV bulk import (Refs #312)`

## PR 本文構成

`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として参照し、
`outputs/phase-12/implementation-guide.md` の主要見出しを漏れなく反映する。
`outputs/phase-11/screenshots/` の 4 画像を screenshot セクションに含める。

## 成果物

- `outputs/phase-13/pr-summary.md`
  - PR URL
  - 採用ブランチ名
  - 実行した自動修復
  - 解消したコンフリクト
  - 残課題（staging deploy / production deploy 等の external ops）

## 完了条件

- PR が `dev` を base として作成される
- `git status --porcelain` が空
- `git diff dev...HEAD --name-only` の全ファイルが PR に含まれる
- 4 screenshot 参照が PR 本文に存在する

## 注意点 / リスク

- **ユーザー明示承認なしに commit / push / PR を実行しない**（Gate-D 不変条件）
- `--no-verify` / `--no-gpg-sign` の使用禁止
- `main` への直接 PR は禁止（base は必ず `dev`）
- conflict 解消は CLAUDE.md「コンフリクト解消の既定方針」表に従う
