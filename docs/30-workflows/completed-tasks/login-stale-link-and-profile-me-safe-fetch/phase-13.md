# Phase 13: PR 作成

## 状態

`blocked` — user 明示承認後のみ実施。

## 前提

- Phase 1-12 すべて green
- `bash scripts/verify-pr-ready.sh` green
- staging deploy 後の runtime 検証完了（user-gated Gate-B）

## 手順（user 承認後）

CLAUDE.md「PR作成の完全自律フロー」に従う:

1. `git fetch origin dev` → ローカル dev FF
2. 作業ブランチに dev マージ（コンフリクト自律解消）
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`
4. `git add -A` で全変更ステージ → commit
5. `gh pr create --base dev --title "fix: login [object Object] 404 と /profile /me safeServerFetch 化" --body @<...>`

## PR 本文構成

- 背景: staging で発生中の2件（console error 抜粋）
- 変更点: Task A / Task B 個別
- テスト: S-1/S-2/S-3 結果
- 視覚証跡: `outputs/phase-11/` から参照（user capture 後）
- 残課題: なし
