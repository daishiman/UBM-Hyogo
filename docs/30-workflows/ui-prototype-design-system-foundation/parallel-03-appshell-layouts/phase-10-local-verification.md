---
phase: 10
title: ローカル検証 — 編集後のローカル確認コマンド集
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 10 — ローカル検証

[実装区分: 実装仕様書]

## 1. 前提

- 作業ディレクトリ: repo root
- Node 24 / pnpm 10 が `mise exec --` で固定
- 初回または依存変更後は `mise exec -- pnpm install`

## 2. 静的検証

```bash
# G1 typecheck
mise exec -- pnpm typecheck

# G2 lint
mise exec -- pnpm lint

# G5 design tokens regression
bash scripts/verify-design-tokens.sh

# G6 test suffix
bash scripts/verify-test-suffix.sh
```

## 3. ビルド検証

```bash
# G3 web build（OpenNext webpack）
mise exec -- pnpm --filter @ubm-hyogo/web build
```

期待: `▲ Next.js 16.x` build success / `.next/standalone` または OpenNext bundle 生成 / warning 0。

## 4. spec 実行

```bash
# 3 layout spec のみ
mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(public)/layout.spec.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(admin)/layout.spec.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(member)/layout.spec.tsx"

# 既存 middleware regression
mise exec -- pnpm --filter @ubm-hyogo/web test -- "middleware.spec.ts"

# web 全 spec（regression 全体）
mise exec -- pnpm --filter @ubm-hyogo/web test
```

## 5. dev server で目視確認

```bash
# Next.js dev（Turbopack）
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

確認手順:
1. `http://localhost:3000/` を開き、wrapper に `data-theme="warm"` / `data-route-group="public"` が DevTools で見えること
2. `<header data-shell="topbar">` / `<footer data-shell="footer">` / `<main data-route="public">` が DOM に存在すること
3. `http://localhost:3000/admin` を開き、未認証なら `/login?next=/admin` redirect すること
4. admin session 取得後（`/login` で magic link / OAuth）`/admin` で `data-theme="cool"` / `[data-shell="sidebar"]` / `[data-shell="topbar"]` / `[data-route="admin"]` が見えること
5. member AppShell は現行 `/login` / `/profile` root path ではなく `(member)` route group 用の土台なので、DOM 実測は追加 member route または layout spec で確認する。`/login` を member layout の実測根拠にしない

## 6. DOM scrape による契約確認

```bash
# curl + grep（dev server 起動中）
curl -s http://localhost:3000/ | grep -E 'data-(theme|route-group|shell|route|testid)='
# member AppShell は route group 内の route が実装された後に scrape する
```

期待: Public / Admin は SSR 段階で期待する data-* 属性が出力される。Member は layout spec を主証跡とし、route 実装後の visual evidence で SSR scrape を追加する。

## 7. design tokens 違反スキャン

```bash
# layout 内に HEX 直書きがないか
rg -nE 'bg-\[#|text-\[#|border-\[#' apps/web/app/'(public)'/layout.tsx apps/web/app/'(admin)'/layout.tsx apps/web/app/'(member)'/layout.tsx
# expected: no matches
```

## 8. axe 単体ローカル実行

```bash
# Playwright を使う場合（serial-07 領域だが手動でも実行可）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --grep "axe"
```

## 9. PR 前最終チェック

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

`verify-pr-ready.sh` は CLAUDE.md「PR作成の完全自律フロー」§5 で必須化されている docs-only gate / Phase 12 compliance / gate-metadata / indexes drift を一括検証する。

## 10. troubleshooting

| 症状 | 対処 |
|------|------|
| `pnpm install` で esbuild エラー | `ESBUILD_BINARY_PATH` を確認、`scripts/cf.sh` 経由なら自動解決 |
| `next build` で "use client" boundary 違反 | layout / primitive 内で client API（`useState` 等）が Server Component に混入していないか確認 |
| Admin layout spec redirect が捕まらない | `vi.mock("next/navigation", () => ({ redirect: vi.fn((u) => { throw new Error(u); }) }))` を使い throw を `expect().rejects` で捕捉 |
| axe で `landmark-unique` violation | R-07 緩和策に従い外側 `<header>` を `<div data-shell="topbar">` に置換 |
