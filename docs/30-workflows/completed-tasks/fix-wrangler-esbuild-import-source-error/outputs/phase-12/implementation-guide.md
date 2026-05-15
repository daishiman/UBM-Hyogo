# Implementation Guide

## Part 1: 中学生レベル

Cloudflare にアプリを載せる作業は、現場監督が大工さんに「この道具で組み立てて」と指示する流れに似ている。今回の現場監督は `wrangler 4.85.0` で、大工さんは `esbuild`。

現場監督は `esbuild 0.27.3` を前提にしているのに、プロジェクト全体では古い `esbuild 0.25.4` を使うよう固定していた。そのため、現場監督が出した新しい指示を大工さんが理解できず、Cloudflare へ出す直前の build が止まっていた。

対応は、プロジェクト全体の固定を `esbuild 0.27.3` へ揃えること。ほかの build 手順も壊れていないか、`build:cloudflare` と wrangler dry-run で確認する。

## Part 2: 技術者レベル

Root `package.json#pnpm.overrides.esbuild` を `0.25.4` から `0.27.3` へ更新し、`pnpm-lock.yaml` を再生成した。`wrangler@4.85.0` の実 dependency は `esbuild=0.27.3` であり、旧 override が wrangler の期待する feature set を下げていた。

`@opennextjs/cloudflare@1.19.4` は直接 esbuild dependency を持たず、現在の lockfile 上では `@opennextjs/aws@3.10.4` が `esbuild=0.25.4` を要求する。両者の exact dependency に交点はないため、設計は「wrangler exact version 優先、OpenNext は実 build で検証」とした。

## Changed Files

| Path | Change |
| --- | --- |
| `package.json` | `pnpm.overrides.esbuild` を `0.27.3` へ更新 |
| `pnpm-lock.yaml` | esbuild packages / snapshots を `0.27.3` へ再生成 |
| `scripts/cf.sh` | wrangler 4.85.0 / esbuild 0.27.3 境界コメントを追記 |
| `docs/30-workflows/fix-wrangler-esbuild-import-source-error/**` | skill準拠・Phase 11/12 evidence・状態語彙を同期 |

## Verification

| Command | Result |
| --- | --- |
| `mise exec -- pnpm install --frozen-lockfile=false` | exit 0 |
| `mise exec -- pnpm why esbuild` | exit 0; one version `0.27.3` |
| `mise exec -- pnpm exec esbuild --version` | exit 0; `0.27.3` |
| `bash -n scripts/cf.sh` | exit 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/api exec wrangler deploy --env staging --dry-run` | exit 0 |

## Runtime Boundary

GitHub Actions `web-cd` / `backend-ci` deploy-staging and `runtime-smoke-staging` evidence are user-gated after Phase 13 PR/push. Do not mark root `completed` until those runtime artifacts exist.

