# Manual Smoke Log

## 判定

NON_VISUAL local evidence only. Cloudflare runtime mutation、staging D1 apply、production classifier switch は実行していない。

## 実行済み

- `pnpm vitest run scripts/cf-audit-log/__tests__/classifier.test.ts scripts/cf-audit-log/__tests__/features-extract.test.ts scripts/cf-audit-log/__tests__/evaluation.test.ts`

