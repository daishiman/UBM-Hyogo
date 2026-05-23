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
ENVIRONMENT=local \
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
INTERNAL_API_BASE_URL=http://127.0.0.1:8787 \
AUTH_URL=http://localhost:3000 \
AUTH_SECRET=local-build-auth-secret-32-bytes \
SENTRY_ENVIRONMENT=local \
SENTRY_TRACES_SAMPLE_RATE=0 \
mise exec -- pnpm --filter @ubm-hyogo/web build   # next build --webpack
```

### 2.2 rg gate（本 SW 専用）

```bash
# G-1: page.tsx の serial-05 コメント存在確認（対象 16 routes 固定）
SERIAL05_ROUTE_FILES=(
  apps/web/app/page.tsx
  'apps/web/app/(public)/members/page.tsx'
  'apps/web/app/(public)/members/[id]/page.tsx'
  'apps/web/app/(public)/register/page.tsx'
  apps/web/app/privacy/page.tsx
  apps/web/app/terms/page.tsx
  apps/web/app/login/page.tsx
  apps/web/app/profile/page.tsx
  'apps/web/app/(admin)/admin/page.tsx'
  'apps/web/app/(admin)/admin/members/page.tsx'
  'apps/web/app/(admin)/admin/tags/page.tsx'
  'apps/web/app/(admin)/admin/meetings/page.tsx'
  'apps/web/app/(admin)/admin/schema/page.tsx'
  'apps/web/app/(admin)/admin/requests/page.tsx'
  'apps/web/app/(admin)/admin/identity-conflicts/page.tsx'
  'apps/web/app/(admin)/admin/audit/page.tsx'
)
for f in "${SERIAL05_ROUTE_FILES[@]}"; do
  test -f "$f" && rg -q '^// serial-05: .+ — blueprint 09[efg]:' "$f" || {
    echo "missing serial-05 marker: $f"
    exit 1
  }
done

# G-2: D1 直接アクセス禁止
! rg -n "D1Database|env\.DB" apps/web/app apps/web/src

# G-3: process.env 直接参照禁止
! rg -n "process\.env\." apps/web/app

# G-4: HEX 直書き
! rg -n "#[0-9a-fA-F]{3,8}" apps/web/app apps/web/src/components apps/web/src/styles

# G-5: bg-[# / text-[# 直書き
! rg -n "bg-\[#|text-\[#" apps/web/app apps/web/src/components

# G-6: localhost 焼き込み
! rg -n "127\.0\.0\.1:8888" apps/web/app apps/web/src

# G-7/8: 新規 primitive / API endpoint 追加なし
test -z "$(git diff --name-only dev...HEAD -- apps/web/src/components/ui apps/api/src/routes)"
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

# static local evidence
mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tee outputs/phase-11/typecheck.log
mise exec -- pnpm --filter @ubm-hyogo/web lint 2>&1 | tee outputs/phase-11/lint.log
ENVIRONMENT=local \
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
INTERNAL_API_BASE_URL=http://127.0.0.1:8787 \
AUTH_URL=http://localhost:3000 \
AUTH_SECRET=local-build-auth-secret-32-bytes \
SENTRY_ENVIRONMENT=local \
SENTRY_TRACES_SAMPLE_RATE=0 \
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee outputs/phase-11/build.log
```

## 5. トラブルシューティング

| 症状 | 対処 |
|------|------|
| `pnpm install` で peer dep warning | `--force` 付与（CLAUDE.md 規約） |
| Node version mismatch | `mise install` → `mise exec -- ...` で再実行 |
| `next build` で `[project]/...` 仮想 module | webpack-only build を確認、Turbopack 痕跡を排除 |
| Playwright が起動しない | `pnpm exec playwright install --with-deps chromium` を再実行 |
| adapter test が壊れる | 既存 API client の型を最新で再 import |
