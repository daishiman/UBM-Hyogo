# テストマトリクス

| # | テスト | 対応 AC | 種別 |
| --- | --- | --- | --- |
| T1 | `getEnv parses the required keys` | AC-3 / AC-4 | unit |
| T2 | `getEnv throws ZodError for invalid URL values` | AC-3 / AC-7 | unit |
| T3 | `getEnv throws ZodError for out-of-range sample rate` | AC-3 / AC-7 | unit |
| T4 | `getEnv allows optional secrets to be absent` | AC-3 | unit |
| T5 | `readRawEnv prefers Cloudflare env when available` | AC-4 | unit |
| T6 | `getPublicEnv returns only the public subset` | AC-3 | unit |
| G1 | grep `127.0.0.1:8888` | AC-5 | smoke gate |
| G2 | grep `process.env.NEXT_PUBLIC_API_BASE_URL`（env.ts 除外） | AC-6 | smoke gate |
| G3 | grep `SENTRY_DSN_WEB = "http` in wrangler.toml | AC-9 | smoke gate |
| Q1 | `pnpm typecheck` / `pnpm lint` | AC-8 | static |
| Q2 | `pnpm --filter @ubm-hyogo/web test` 全 PASS | AC-7 / AC-8 | unit suite |
