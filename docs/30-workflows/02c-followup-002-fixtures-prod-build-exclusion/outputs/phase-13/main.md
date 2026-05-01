# Phase 13 main output — 02c-followup-002-fixtures-prod-build-exclusion

## 状態

- pending_user_approval（commit / push / PR は未実行）

## 変更サマリ

- `apps/api/tsconfig.build.json` を追加し、production build typecheck から test / fixture / spec を除外。
- `apps/api/package.json` の `build` を `tsconfig.build.json` に切替。
- `.dependency-cruiser.cjs` に production code → `__fixtures__` / `__tests__` 禁止 rule を追加。
- root `package.json` に `lint:deps` を追加し、通常 `lint` 経路へ dep-cruiser gate を接続。
- 02c 完了タスク implementation guide の不変条件 #6 に三重防御を追記。
- 本 workflow の Phase 12 close-out 成果物と正本仕様同期を補完。

## 実測結果

- `pnpm --filter @ubm-hyogo/api build`: PASS。
- `pnpm --filter @ubm-hyogo/api typecheck`: PASS。
- dep-cruiser通常実行: PASS（0 violations）。
- dep-cruiser合成違反: PASS（`no-prod-to-fixtures-or-tests` 1 error）。
- esbuild bundle substitute: PASS（`__fixtures__` / `__tests__` / `miniflare` 0 件）。
- `pnpm --filter @ubm-hyogo/api test`: FAIL（pre-existing `sync-forms-responses.test.ts` 4 failures。本 diff 起因ではないため未タスク化）。

## approval gate

- commit / push / PR 作成は禁止。ユーザーの明示指示があるまで実行しない。
- deploy / wrangler real dry-run は未実行。dry-run 実測は follow-up に分離。
