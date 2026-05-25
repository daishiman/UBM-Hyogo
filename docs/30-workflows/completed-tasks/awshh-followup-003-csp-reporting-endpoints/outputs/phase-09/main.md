# Phase 9 output: 品質保証サマリ

- 検証: `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web test -- security-headers`。
- env アクセス不変条件（process.env 直接参照 0 件）/ secret hygiene（実 DSN 非転記）/ #5（apps/api・D1 diff 0 件）を確認。
- 詳細: [phase-09.md](../../phase-09.md)
