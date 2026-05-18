---
phase: 10
title: ローカル検証コマンド
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 10 — ローカル検証コマンド

[実装区分: 実装仕様書]

## 1. 事前準備

```bash
mise install                       # Node 24 + pnpm 10
mise exec -- pnpm install --force  # ワークツリーごとに必要
```

## 2. 段階的検証

### 2.1 型・lint・build

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build   # next build --webpack
```

### 2.2 grep gate（本 SW 専用）

```bash
# G-1: page.tsx の serial-05 コメント存在確認
grep -L "// serial-05:" apps/web/app/**/page.tsx | grep -v __smoke__ | grep -v visual-harness

# G-2: D1 直接アクセス禁止
grep -rnE "D1Database|env\.DB" apps/web/app apps/web/src || echo "OK: D1 directアクセスなし"

# G-3: process.env 直接参照禁止
grep -rnE "process\.env\." apps/web/app || echo "OK: process.env なし"

# G-4: HEX 直書き
grep -rnE "#[0-9a-fA-F]{3,8}" apps/web/app apps/web/src/components apps/web/src/styles \
  | grep -v "// " | grep -v "node_modules" || echo "OK: HEX なし"

# G-5: bg-[# / text-[# 直書き
grep -rnE "bg-\[#|text-\[#" apps/web/app apps/web/src/components || echo "OK"

# G-6: localhost 焼き込み
grep -rnE "127\.0\.0\.1:8888" apps/web/app apps/web/src || echo "OK"

# G-7/8: 新規 primitive / API endpoint 追加なし
git diff dev...HEAD --name-only | grep -E "components/ui/|apps/api/src/routes/" || echo "OK"
```

### 2.3 unit / smoke test

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test                # vitest 全層
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/adapters  # adapter のみ
```

### 2.4 Playwright smoke (local)

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/smoke
```

### 2.5 PR pre-flight 一括

```bash
bash scripts/verify-pr-ready.sh
```

## 3. dev server 起動

```bash
# API
mise exec -- pnpm --filter @ubm-hyogo/api dev
# Web (別ターミナル)
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

http://localhost:3000 で 19 routes を目視確認。`/(admin)/admin/*` は test admin（`manjumoto.daishi@senpai-lab.com`）でログイン。

## 4. evidence 生成

```bash
# Playwright smoke の JSON サマリ
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/smoke \
  --reporter=json > outputs/phase-11/playwright-smoke.json

# verify-design-tokens
mise exec -- pnpm verify:design-tokens 2>&1 | tee outputs/phase-11/verify-design-tokens.log
```

## 5. トラブルシューティング

| 症状 | 対処 |
|------|------|
| `pnpm install` で peer dep warning | `--force` 付与（CLAUDE.md 規約） |
| Node version mismatch | `mise install` → `mise exec -- ...` で再実行 |
| `next build` で `[project]/...` 仮想 module | webpack-only build を確認、Turbopack 痕跡を排除 |
| Playwright が起動しない | `pnpm exec playwright install --with-deps chromium` を再実行 |
| adapter test が壊れる | 既存 API client の型を最新で再 import |
