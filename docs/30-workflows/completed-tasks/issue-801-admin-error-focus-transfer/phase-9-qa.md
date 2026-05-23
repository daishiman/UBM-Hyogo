# Phase 9: QA — issue-801 admin error focus transfer

## QA チェックリスト

### コード QA

- [ ] `apps/web/app/(admin)/admin/error.tsx` が Phase 2 §3.1 と一致
- [ ] `"use client"` 最上行
- [ ] React import: `useEffect`, `useRef`
- [ ] logger import path 解決OK（`../../../src/lib/logger` or `@/lib/logger`）
- [ ] `useRef<HTMLHeadingElement>(null)` 型注釈
- [ ] `useEffect` 依存配列 `[error]`
- [ ] `focus({ preventScroll: true })` の引数オブジェクト一致
- [ ] h1 に `ref` + `tabIndex={-1}` 両方付与
- [ ] wrapper に `role="alert"` + `aria-live="assertive"` 両方付与
- [ ] Link href `/`（`/admin` 不可）
- [ ] OKLch トークン className のみ、HEX / `ubm-color-*` / `bg-[#xxx]` 不在

### コマンド実行

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run admin/__tests__/error.component
```

すべて 0 error / 0 fail。

### CI gate 事前確認（PR 直前）

```bash
bash scripts/verify-pr-ready.sh
```

Phase 13 で push / PR を実行する直前に確認する。今回サイクルでは PR 作成を行わないため、実行済み PASS としては主張しない。

今回の実測:

- `pnpm verify:phase12-compliance --root docs/30-workflows/issue-801-admin-error-focus-transfer` PASS
- `pnpm -F "@ubm-hyogo/web" typecheck` PASS
- `pnpm -F "@ubm-hyogo/web" lint` PASS
- `pnpm -F "@ubm-hyogo/web" test -- --run 'apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx'` PASS（apps/web suite 実行、新規 admin error test 13 件含む）

### diff スコープ確認

```bash
git diff dev...HEAD --name-only
```

期待:
```
apps/web/app/(admin)/admin/error.tsx
apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx
docs/30-workflows/issue-801-admin-error-focus-transfer/**
```

スコープ外（admin 以外、API、D1、middleware）が混入していないこと。

## 不変条件最終確認

- AC-15: `git diff dev...HEAD -- apps/web/middleware.ts apps/web/src/auth` → 空
- AC-16: `git diff dev...HEAD -- apps/api/src/routes/admin/ apps/api/src/db/` → 空

## DoD

- 全 QA チェック PASS
- CI 事前検証 PASS
- diff スコープ準拠
