# Phase 9: 品質保証

## 9.1 検証コマンド一括

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build         # OpenNext Workers 互換 (webpack)
mise exec -- pnpm --filter @ubm-hyogo/web vitest run
bash scripts/verify-pr-ready.sh
```

## 9.2 不変条件 grep gate

```bash
# admin lib に process.env 直参照が残っていないか（fixture 系は許容）
grep -rn "process\.env\[" apps/web/src/lib/admin/ \
  | grep -v "process\.env\[\"\(NODE_ENV\|PLAYWRIGHT_[A-Z0-9_]*\)\"\]"
# 期待: 0 行

# 127.0.0.1 リテラル
grep -rn "127\.0\.0\.1" apps/web/src/
# 期待: 該当なし（apps/web/src 配下）
```

## 9.3 OpenNext Workers build artifact 確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
ls -la apps/web/.open-next/worker.js 2>&1 | head -3
```

`worker.js` が生成され、bundle に `[project]/...` 仮想 module specifier が混入しないことを確認。

## 9.4 mirror parity（該当時のみ）

skill 改変は本タスクのスコープ外であるため `.claude` / `.agents` mirror diff は不要。
