# Phase 9: 品質保証

5 点セット結果:
| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm install` | exit 0（AC-1） |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | 0 error（AC-7） |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | 0 error |
| `mise exec -- pnpm vitest run apps/web/src/__tests__/tokens.test.ts` | 8 passed（AC-10） |
| `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0、`.open-next/worker.js` 生成（AC-8） |
| `bash outputs/phase-4/hex-grep-gate.sh apps/web/src` | HEX 直書き 0 件（AC-11） |
| `curl http://localhost:8788/` (preview) | HTTP 200（AC-9） |

apps/web の他テスト suite（53 files, 434 tests）も全 pass。
