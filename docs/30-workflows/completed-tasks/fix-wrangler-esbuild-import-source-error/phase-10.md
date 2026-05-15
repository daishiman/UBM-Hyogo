# Phase 10: 最終レビュー

## 10.1 acceptance criteria 照合（index.md §7 DoD）

| # | 受入条件 | 判定方法 | Status |
|---|---------|---------|--------|
| AC-1 | `pnpm install --frozen-lockfile=false` がローカル/CI で成功 | EXT-1 + CI green | pending（実装後判定）|
| AC-2 | `apps/api` wrangler dry-run (staging) 成功 | EXT-6 | pending |
| AC-3 | `apps/web` `build:cloudflare` 成功 | EXT-8 | pending |
| AC-4 | `web-cd` / `backend-ci` deploy-staging green | PR merge 後の GitHub Actions URL | pending（Phase 13 後判定）|
| AC-5 | Phase 12 strict 7 成果物が `outputs/phase-12/` に存在 | `find outputs/phase-12 -maxdepth 1 -type f` | pending |

## 10.2 blocker 判定基準

| 区分 | 内容 | 対応 |
|------|------|------|
| CRITICAL | EXT-4〜7 のいずれかが exit ≠ 0 | Phase 5 タスク 1 に戻る |
| MAJOR | EXT-8 または EXT-9 が exit ≠ 0 | OpenNext / Next.js 側の追加対応を別タスク化（Phase 12 unassigned） |
| MINOR | `pnpm typecheck` 等で esbuild 起因 warning | 仕様書注釈で吸収、未タスク化 |

## 10.3 想定される MINOR 指摘 → 未タスク化候補

| 候補 | Phase 12 未タスク化 |
|------|---------------------|
| wrangler 自動 bump を Renovate / Dependabot 化 | unassigned-task-detection に記載 |
| `pnpm view <wrangler@X> dependencies.esbuild` を確認する CI gate | 同上 |
| esbuild override が wrangler 同梱版と乖離していないかの drift check | 同上 |

> MINOR 指摘は必ず未タスク化対象（[Phase 10 MINOR 指摘を未タスク化せず進行] 防止）。

## 10.4 Go / No-Go

- AC-1〜4 のローカル evidence 設計が揃っていることを条件に Phase 11 へ Go。AC-5 は Phase 12 close-out gate として判定する。
- CRITICAL がある場合は Phase 5 へ差し戻し。
