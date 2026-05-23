# Phase 13 outputs / main

## PR 作成方針

- **user 明示承認後のみ実行**（CONST_002）
- base = `dev`（CLAUDE.md 既定）
- Issue #616 は CLOSED 維持。`Refs #616`（`Closes` 禁止）

## 手順

1. ブランチ確認
2. `git fetch origin dev` → ローカル dev FF → 作業ブランチに dev マージ
3. `mise exec -- pnpm install --force` / `pnpm typecheck` / `pnpm lint`
4. `git status --porcelain` で残差分なし
5. `gh pr create --base dev --title "docs(workflow): task-issue-577-followup-002 Miniflare/undici upstream tracking spec" --body ...`

## PR 本文必須要素

- Phase 12 implementation-guide.md 主要見出し反映
- evidence ファイル参照（`outputs/phase-11/evidence/*`）
- 改善検知結果（あり / なし）と採用 N（または「維持」）
- `Refs #616`

## 禁止事項

- Issue #616 reopen
- `--no-verify` push
- main 直 PR

## 完了条件

- [ ] PR 作成完了 / URL 取得
- [ ] CI typecheck / lint pass
- [ ] Issue #616 CLOSED 維持確認

## 最終レポート要素

- PR URL / ブランチ / 改善検知有無 / 採用 N / 残課題
