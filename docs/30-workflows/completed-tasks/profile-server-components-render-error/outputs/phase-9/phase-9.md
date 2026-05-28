# Phase 9: 品質保証

## 9.1 検証コマンド一括

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build         # OpenNext Workers 互換 (webpack)
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run apps/web/src/lib/fetch/authed.spec.ts "apps/web/app/(member)/profile/page.spec.tsx"
bash scripts/verify-pr-ready.sh
```

## 9.2 不変条件 grep gate

```bash
# authed.ts に process.env 直参照が残っていないか
grep -n "process\.env\[" apps/web/src/lib/fetch/authed.ts
# 期待: 0 行

# 127.0.0.1 リテラル
grep -n "127\.0\.0\.1" apps/web/src/lib/fetch/authed.ts
# 期待: 0 行

# profile/page.tsx に process.env 直参照が残っていないか
grep -n "process\.env\[" "apps/web/app/(member)/profile/page.tsx"
# 期待: 0 行
```

## 9.3 OpenNext Workers build artifact 確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
ls -la apps/web/.open-next/worker.js 2>&1 | head -3
```

`worker.js` が生成され、bundle に `[project]/...` 仮想 module specifier が混入しないことを確認。

## 9.4 mirror parity（該当時のみ）

skill 改変は本タスクのスコープ外であるため `.claude` / `.agents` mirror diff は不要。
