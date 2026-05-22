---
phase: 6
title: テスト方針 — smoke / rendering / Playwright visual
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 6 — テスト方針

[実装区分: 実装仕様書]

## 1. テスト層構成

| 層 | 目的 | tool | 配置 |
|----|------|------|------|
| L1 unit | adapter 純関数の入出力 | vitest | `apps/web/src/lib/adapters/__tests__/*.spec.ts` |
| L2 component smoke | page.tsx の render 失敗を即時検出 | vitest + RTL | `apps/web/app/**/__tests__/*.spec.tsx`（既存配置慣習） |
| L3 fixture rendering | members/[id] の API fixture から `MemberDetail` 描画 | vitest + msw or fixture seed | `apps/web/src/__tests__/__fixtures__/*` |
| L4 Playwright smoke | 19 routes の 200/redirect 検証 | playwright | `apps/web/playwright/smoke/*.spec.ts` |
| L5 Playwright visual | 4 screens snapshot | playwright | `apps/web/playwright/tests/visual/*.spec.ts`（SW-07 担当・本 SW では fixture 整備のみ） |

## 2. テスト対象マトリクス

| route | L1 | L2 | L3 | L4 | L5 |
|-------|----|----|----|----|----|
| `/` | — | smoke | — | 200 | snapshot |
| `/(public)/members` | adapter | smoke | — | 200 + filter | — |
| `/(public)/members/[id]` | adapter | smoke | fixture | 200 + 404 | snapshot |
| `/(public)/register` | — | smoke | — | 200 | — |
| `/privacy` / `/terms` | — | — | — | 200 | — |
| `/login` | — | smoke | — | 200 | — |
| `/profile` | adapter | smoke | — | unauth→redirect | — |
| `/(admin)/admin` | adapter | smoke | — | unauth→redirect | snapshot |
| `/(admin)/admin/*` × 7 | — | smoke（代表） | — | 200 | — |
| `error.tsx` / `not-found.tsx` | — | smoke | — | — | — |

## 3. fixture 経路（members/[id] L3）

```
apps/web/src/__tests__/__fixtures__/
├── public-member-detail.fixture.json  # 既存 task-11 系で確立
└── public-member-detail.fixture.ts    # adapter 経由で BlueprintMemberDetail を返す helper
```

L3 では msw で `GET /public/members/:id` を fixture 返却し、page.tsx を render → MemberDetailSections の `visibility=public` field のみ表示されることを確認。

## 4. Playwright smoke の最小契約

各 route で:

1. HTTP 200（または期待 redirect）
2. `<main data-route="...">` が存在
3. `verify-design-tokens` 対象の HEX 直書きを含まない（CI gate と二重防御）

`apps/web/playwright/smoke/routes.spec.ts` に 19 件を test.each で並列実行。

## 5. test suffix 規約

新規テストは **`*.spec.{ts,tsx}` 必須**。lefthook `block-test-suffix` と CI `verify-test-suffix` が reject する。`*.test.*` は禁止。

## 6. visual baseline 整合

L5 (visual) は SW-07 の担当だが、本 SW で `data-route` / `data-card-tone` の attribute 配置が安定していることが前提。snapshot 名は SW-07 で固定。本 SW では `apps/web/playwright/tests/visual/public-top.spec.ts` 等のファイルを物理新規しない。

## 7. mock / seed の不変条件

- API mock は msw もしくは vitest mock のみ。production code への mock 注入禁止
- D1 fixture は本 SW では使用しない（D1 直接アクセス禁止の不変条件と整合）
- Form schema 固定回避: fixture は section/field の配列形でのみ表現

## 8. CI 連携

| job | 内容 |
|-----|------|
| `web-unit` | vitest 全層 |
| `web-typecheck` | tsc --noEmit |
| `web-lint` | eslint |
| `web-build` | next build --webpack |
| `playwright-smoke / smoke (chromium)` | L4 全件（required check 候補） |
| `playwright-smoke / visual (chromium, 4 screens)` | L5（SW-07 で fixate） |
| `verify-design-tokens / verify-design-tokens` | HEX 0 件確認 |
| `verify-test-suffix` | `*.test.*` 0 件確認 |
