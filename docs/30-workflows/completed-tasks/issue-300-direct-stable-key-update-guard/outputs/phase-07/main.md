[実装区分: 実装仕様書]

# Phase 7 Output: CI / lefthook / package.json

仕様本体: `../../phase-07.md`

## 変更対象

- new: `.github/workflows/verify-stable-key-update.yml`
- modify: `lefthook.yml`（`pre-commit.commands.block-stable-key-update`）
- modify: `package.json` scripts（`lint:stable-key-update[:strict]` + `lint` chain への組み込み）

## 状態

`completed`
