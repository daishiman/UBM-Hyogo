---
phase: 10
title: Local verification — 実行コマンド集
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
---

# Phase 10 — Local verification

[実装区分: 実装仕様書]

## 1. 前提

```bash
# Node 24 / pnpm 10 を mise で保証（worktree 初回）
mise install
mise exec -- pnpm install
```

## 2. 検証手順（実装後に上から順に実行）

```bash
# 1. primitive 単体 spec
mise exec -- pnpm exec vitest run apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx

# 2. 既存 admin layout spec（無修正 pass を確認）
mise exec -- pnpm exec vitest run "apps/web/app/(admin)/layout.spec.tsx"

# 3. 型チェック
mise exec -- pnpm typecheck

# 4. lint
mise exec -- pnpm lint

# 5. web build
ENVIRONMENT=local SENTRY_ENVIRONMENT=local SENTRY_TRACES_SAMPLE_RATE=0 NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 PUBLIC_API_BASE_URL=http://127.0.0.1:8787 INTERNAL_API_BASE_URL=http://127.0.0.1:8787 AUTH_URL=http://127.0.0.1:3000 mise exec -- pnpm --filter @ubm-hyogo/web build

# 6. design token gate
mise exec -- pnpm verify:tokens
```

## 3. 補助確認（grep ベース）

```bash
# inline header が layout から消えたか
! grep -n 'data-shell="topbar"' "apps/web/app/(admin)/layout.tsx" && echo "OK: layout から topbar header が除去された"

# AdminTopbar が呼ばれているか
grep -n "<AdminTopbar" "apps/web/app/(admin)/layout.tsx"

# primitive 側に data-shell="topbar" があるか
grep -n 'data-shell="topbar"' apps/web/src/components/layout/AdminTopbar.tsx

# "use client" を付けていないか
! grep -n '"use client"' apps/web/src/components/layout/AdminTopbar.tsx && echo "OK: Server Component"

# layout spec が無修正か
git diff --stat -- "apps/web/app/(admin)/layout.spec.tsx"  # 空であること
```

## 4. evidence 取得（任意・PR 添付用）

```bash
mkdir -p docs/30-workflows/parallel-03-followup-001-admin-topbar-primitive-extraction/outputs/phase-11
mise exec -- pnpm typecheck 2>&1 | tee docs/30-workflows/parallel-03-followup-001-admin-topbar-primitive-extraction/outputs/phase-11/typecheck.log
mise exec -- pnpm lint 2>&1 | tee docs/30-workflows/parallel-03-followup-001-admin-topbar-primitive-extraction/outputs/phase-11/lint.log
```

## 5. dev server での目視（任意）

```bash
mise exec -- pnpm --dir apps/web dev
# admin session でログインし /admin を開き、topbar の「管理」表示・border が従来通りかを目視
```
