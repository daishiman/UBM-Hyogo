# Phase 9 — 品質保証

## 目的

ローカル検証と visual evidence 取得前の品質 gate を固定する。

## 必須コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- public
mise exec -- pnpm verify:tokens
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## 完了条件

- ✅ `mise exec -- pnpm typecheck` PASS
- ✅ `mise exec -- pnpm lint` PASS
- ✅ `mise exec -- pnpm --filter @ubm-hyogo/web test` PASS（873 PASS / 1 skipped）
- ✅ `NEXT_PUBLIC_API_BASE_URL=http://localhost:8787 ENVIRONMENT=local mise exec -- pnpm --filter @ubm-hyogo/web build` PASS
- ✅ `pnpm verify:tokens` PASS
