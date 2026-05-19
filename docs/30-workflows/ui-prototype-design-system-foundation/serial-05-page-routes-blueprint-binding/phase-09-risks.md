---
phase: 9
title: リスク・代替案 — 依存 / 衝突 / 互換
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 9 — リスク・代替案

[実装区分: 実装仕様書]

> **強い前提（再掲）**: 本 SW は `parallel-01..04` が完了している前提で実装する。
> 前提崩壊時はリスク R-1 が顕在化する。

## 1. リスク一覧

| ID | 内容 | 影響 | 緩和策 |
|----|------|------|--------|
| R-1 | **parallel-01..04 依存崩壊** — `@layer components` / AppShell layout / Root chrome が未完成 | page.tsx が裸で表示され visual snapshot が大きく drift | 着手前に `git log --oneline parallel-01..04` で完了 commit を確認。未完了なら SW-05 を pause |
| R-2 | **既存 page.tsx との衝突** — `app/page.tsx`, `app/(public)/members/page.tsx` 等は task-11 系で骨格が確定済み | 余計な書き換えが regression を生む | 差分最小化方針（Phase 5 §5）を厳守、blueprint 整合のみ追加 |
| R-3 | **OpenNext Workers build 互換** — Turbopack 残骸 / `[project]/...` 仮想 module specifier 混入 | `next build --webpack` で fail、Cloudflare deploy で fail | webpack-only build を CI で fail-fast、`apps/web/wrangler.toml` の build 構成は変えない |
| R-4 | **既存 API shape と blueprint shape の乖離** | UI が空表示／runtime error | adapter 層（Phase 2 §2.3）で吸収。adapter は pure function + unit test 必須 |
| R-5 | **member chrome の取り扱い不整合** — URL と route group 物理配置を混同すると `app/login/page.tsx` / `app/profile/page.tsx` の編集対象を誤る | chrome 不整合・不要な rename regression | `PROTOTYPE-COVERAGE.md` の `current_app_path` に従い、`login/` と `profile/` は root 配下を維持する。`(member)` layout は将来 route 用で、今回の profile 実装では依存させない |
| R-6 | **Next.js 16 searchParams Promise 化** | `await searchParams` 忘れで type error | grep gate `await searchParams` を pre-flight に組み込む |
| R-7 | **D1 直接アクセス混入** | 不変条件 #5 違反、Workers build fail | grep G-2 |
| R-8 | **新規 primitive / API endpoint の混入** | NFR-3/4 違反 | grep G-7/G-8、git diff CI gate |
| R-9 | **revalidate 値の不整合** — admin で revalidate を指定し古いデータが表示される | 運用ミスリード | Phase 2 §5 表通り。admin は 0 を厳守 |
| R-10 | **adapter の view 汚染** — adapter が lib/api を逆汚染（adapter 型を lib/api/* が import） | 双方向依存で循環 | adapter 層は lib/api からのみ import、lib/api は adapter を import しない |
| R-11 | **session/cookie の Server Component 内アクセスで Next.js 16 仕様変更** | 認証 redirect が動かない | 既存 `apps/web/src/lib/session.ts` 経路を維持、変更しない |
| R-12 | **localhost endpoint 焼き込み** | task-18 regression smoke fail | grep G-6 |

## 2. 代替案と不採用理由

| 案 | 不採用理由 |
|----|----------|
| page.tsx を全面書き直し | 既存 task-11 系の rendering / revalidate / connection() 配置が安定。書き直しは regression リスク > 利得 |
| adapter を `app/_lib/` に置く | App Router の private folder（`_`）規約と `src/lib/` 既存パターンが衝突。`apps/web/src/lib/adapters/` で統一 |
| (member) group へ login/profile 物理移動 | 外部リンク・テスト・既存 cookie / redirect 整合の影響範囲が大きい。SW-03 layout で chrome を継承する方が安全 |
| primitive 追加で blueprint を直接表現 | 不変条件 #4 違反。既存 13 primitives + 既存 feature components で組み立て可能 |
| API endpoint を増やして adapter を不要化 | 不変条件 #3 違反、後続の D1 schema 変更を誘発 |

## 3. ロールバック方針

PR 単位で revert 可能とし、commit 粒度を「グループ単位」に揃える（G-T / G-M / G-A / G-R / G-D / G-G / G-F の 6+1 commit）。Phase 13 で具体的に列挙。

## 4. 監視・観測

本 SW では新規 instrumentation を入れない。既存 Sentry / Logger（`apps/web/src/lib/sentry/*`, `logger.ts`）の経路を維持。
