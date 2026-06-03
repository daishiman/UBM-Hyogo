# 2026-05-31 issue-1027 member dynamic OG Worker split

`issue-1027-member-dynamic-og-worker-split` を `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` として同期した。
Cloudflare Workers Free 3MiB 制約を守るため、main `apps/web` へ `next/og` を戻さず、`apps/og` (`@ubm-hyogo/og`) の専用 Worker に `workers-og` による member OG PNG 生成を隔離した。

同一 wave で `OG_IMAGE_BASE_URL` を `apps/web/src/lib/env.ts` 経由の optional public env として追加し、member detail metadata の `openGraph.images` / `twitter.images` を OG Worker URL へ接続した。`og-cd.yml` は build → `scripts/check-worker-size.sh apps/og/dist`（index.js + wasm 合算）→ deploy の順に実行する。

ローカル evidence は OG Worker typecheck / Vitest / Wrangler dry-run build / size gate、web metadata focused tests、web typecheck が PASS。Cloudflare deploy、staging runtime PNG capture、commit、push、PR、Issue #1027 mutation は user-gated。
