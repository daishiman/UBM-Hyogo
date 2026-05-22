# Phase 9 Output — Quality gate 実行結果

Quality gate は typecheck、lint、node test、`mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`、grep gate。

## 実行ログ

| gate | コマンド | 結果 |
|------|---------|------|
| node --test | `mise exec -- node --test scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` | PASS (9/9) — `quality-evidence.log` 参照 |
| build:cloudflare | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | BLOCKED before patch script by OpenNext/esbuild version mismatch — `build-cloudflare-evidence.log` 参照 |
| cwd guard | `mise exec -- node scripts/patch-next-standalone-instrumentation.mjs` (root cwd) | exit 1 / `event=cwd_guard_failed` ログ確認 |
| YAML schema | `python3 yaml.safe_load .github/workflows/pr-build-test.yml` | OK |
| typecheck | `pnpm typecheck` | apps/web で `@sentry/cloudflare` / `@sentry/nextjs` 未解決の **既存 fail**（task-03 スコープ）。本タスクでは導入していない |
| lint | `pnpm lint` | 同上の既存 fail のみ |

本タスクが追加した `.mjs` script / test / runbook / workflow step に起因する fail は無い。`build:cloudflare` は patch script 到達前に OpenNext/esbuild mismatch で停止したため、CI-side runtime artifact verification は pending として扱う。
