# Implementation Guide - task-18-w7

## Part 1 - 中学生レベル

このタスクは、サイトのデザインのルールと画面が壊れていないかをコンピュータで確認する仕組みを作る。
色や余白のルールがずれたら止める。17 個のページが開けるかも確認する。
さらに 4 つの大事な画面を画像で比べ、見た目が大きく変わったら人が確認できるようにする。

## Part 2 - 技術者レベル

- `scripts/verify-design-tokens.ts` は `09b-design-tokens.md`、`tokens.css`、`globals.css @theme inline` を比較する。
- Playwright specs は現行 config の `testDir: ./playwright/tests` に合わせ、`apps/web/playwright/tests/` 配下へ置く。
- Evidence は `.gitignore` に当たらない `.txt` / `.json` で保存する。
- Branch protection は read response をそのまま PUT せず、PUT 用 payload へ正規化する。

## PR description draft

## Summary

- Add design token drift verification.
- Add Playwright smoke for 17 URL routes and visual baseline for 4 screens.
- Prepare three required status check candidates.

## Verification

- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm verify:tokens`
- `pnpm --filter @ubm-hyogo/web e2e:smoke`
- `pnpm --filter @ubm-hyogo/web e2e:visual`
