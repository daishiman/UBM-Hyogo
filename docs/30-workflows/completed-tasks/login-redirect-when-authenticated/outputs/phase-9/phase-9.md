# Phase 9 — 品質保証（一括判定）

## 1. 実行コマンド一括

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/url/__tests__/safe-next.spec.ts \
  apps/web/app/login/__tests__/page.spec.tsx
```

## 2. 判定マトリクス

| 観点                 | 判定基準                                      | 期待 |
| -------------------- | --------------------------------------------- | ---- |
| typecheck            | 0 errors                                      | PASS |
| lint                 | 0 errors / 0 warnings（変更ファイル）         | PASS |
| unit test            | safe-next 16/16 + login page 6/6             | PASS |
| coverage             | safe-next.ts line/branch 100%                 | PASS |
| line budget          | safe-next.ts ≤ 30 行 / page.tsx 追加 ≤ 10 行  | PASS |
| 不要 import          | grep 「unused」なし                           | PASS |
| mirror parity        | 該当なし（コード変更で skill mirror 不要）    | N/A  |

## 3. blocker 判定

PASS でなければ Phase 5/6 へ巻き戻し。

## 4. DoD

- [x] 全 6 項目 PASS
