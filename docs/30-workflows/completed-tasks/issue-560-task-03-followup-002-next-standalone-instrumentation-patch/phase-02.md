# Phase 2: current state 調査 / patch 対象 path 確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| Source | `outputs/phase-2/phase-2.md` |
| 状態 | completed |

## 目的

`scripts/patch-next-standalone-instrumentation.mjs` および `apps/web/open-next.config.ts` `buildCommand` の現状を grep / read で確認し、patch 対象 path・出力 path・既存 stub の有無を確定する。

## 実行タスク

詳細は `outputs/phase-2/phase-2.md` を正本とする。要点:

- `find scripts -name "*patch*next*"` / `grep -n "buildCommand" apps/web/open-next.config.ts` で現状確認
- current state: `scripts/patch-next-standalone-instrumentation.mjs` は既に存在し、`.next/server/instrumentation.js` / `.map` / `server/instrumentation.js.nft.json` / trace files を `.next/standalone/apps/web/.next/` へ copy している
- standalone build 出力 path を `apps/web/.next/standalone/apps/web/.next/server/instrumentation.js` に確定（OpenNext / Next.js バージョン依存）
- `server/instrumentation.js.nft.json` の trace files を copy する現行方式を維持し、固定 `src/instrumentation.ts` copy 案は採用しない
- `.github/workflows/pr-build-test.yml` の `build-test` job を CI gate 注入先として実在確認（`workflow path existence gate`）。`web-cd.yml` は Pages deploy current state のため本タスクの変更対象外
- 親タスク task-03 配置済みの `apps/web/src/instrumentation.ts` と `apps/web/open-next.config.ts` の現行連携を確認する

## 参照資料

- `apps/web/open-next.config.ts`
- `apps/web/package.json`（OpenNext / Next.js version）
- `.github/workflows/*.yml`

## 成果物

- `outputs/phase-2/phase-2.md`（current state スナップショット + patch 対象 path 確定表）

## 完了条件

- patch 入力 / 出力 path が表で確定
- workflow path existence gate PASS（`.github/workflows/pr-build-test.yml` が実在し、`build-test` job に step 追加できる）
- task-03 との依存解決順序が明示（task-03 PASS 後に Phase 5 RED へ進む条件）
