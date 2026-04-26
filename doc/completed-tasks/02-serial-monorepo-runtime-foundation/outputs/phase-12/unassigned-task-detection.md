# Unassigned Task Detection

## 検出結果

| 未タスク | 内容 | 種別 | 対応方針 |
| --- | --- | --- | --- |
| なし | Node 24.x 実環境検証と Workers bundle size 証跡は UT-20 として同一 wave で完了 | completed | Node v24.15.0 / pnpm 10.33.2 で install、typecheck、OpenNext build、bundle size 確認を完了 |

## 実装済みとして再分類した項目

| 旧ID | 内容 | 現在状態 | 根拠 |
| --- | --- | --- | --- |
| UT-01 | apps/web/wrangler.toml を @opennextjs/cloudflare 向けに更新 | DONE | `main = ".open-next/worker.js"` と `[assets] directory = ".open-next/assets"` を反映済み |
| UT-02 | pnpm-workspace.yaml / package.json / .nvmrc の実ファイル作成 | DONE | root workspace / engines / package scripts を作成済み |
| UT-03 | apps/web/next.config.ts の作成 | DONE | `next.config.ts` と `open-next.config.ts` を作成済み |
| UT-04 | apps/api/src/index.ts（Hono entry point）の作成 | DONE | `/` と `/health` の Hono route を作成済み |
| UT-05 | packages/shared / packages/integrations のスケルトン作成 | DONE | runtime foundation contract と integration runtime target を作成済み |
| UT-07 | TypeScript 6.x tsconfig の strict 設定の実適用 | DONE | root / app / package tsconfig に strict 設定を適用し、`pnpm typecheck` PASS |

## 未タスクの分類

| 分類 | 件数 |
| --- | --- |
| 後続 verification task | 0件 |
| 本 task で実装済みへ再分類 | 6件 |
| 本 task 内での MAJOR blocker | 0件 |

注記: 本 task は `code_and_docs` として close-out する。旧 docs-only 前提で検出した implementation task は current facts に合わせて再分類済み。

## 正式未タスク化

| 未タスク指示書 | 内容 |
| --- | --- |
| `doc/unassigned-task/UT-20-runtime-foundation-implementation.md` | Node 24.x 実環境での install / typecheck / OpenNext build / bundle size 証跡取得を完了済みとして記録 |
