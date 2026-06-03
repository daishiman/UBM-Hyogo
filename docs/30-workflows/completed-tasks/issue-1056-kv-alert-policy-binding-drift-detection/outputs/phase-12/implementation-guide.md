# Implementation guide

## Part 1: 中学生レベル

KV や R2 は、Cloudflare にある保管場所です。保管場所を使っているなら、使いすぎを知らせるアラートも有効であるべきです。

今回の仕組みは、`wrangler.toml` を見て「KV/R2 を使っているか」を調べます。次に alert policy の JSON を見て「アラートが有効か」を調べます。

使っているのにアラートが無効なら `MONITORING_GAP`、使っていないのにアラートが有効なら `STALE_MONITORING` として失敗します。

## Part 2: 技術者レベル

`infra/cloudflare-alerts/lib/binding-policy-drift.ts` が `apps/api/wrangler.toml` を line parser で読み、commented block を inactive として扱う。TOML parser はコメント状態を保持できないため不採用。

policy state は既存 `loadExpected(repoRoot).policies` を再利用する。mapping は kind 粒度で、KV は `workers-kv-writes-per-day` / `workers-kv-stored-bytes`、R2 は `r2-class-a` に対応する。

CLI は `bash scripts/cf.sh alerts binding-drift [--json] [--ci]`。Cloudflare API と token を要求せず、PR validate job から `pnpm cf:alerts:binding-drift --ci` で実行する。

## 視覚証跡

NON_VISUAL tooling のため screenshot は不要。代替証跡は `pnpm test:alerts` と `pnpm cf:alerts:binding-drift --ci`。

## 検証コマンド

```bash
pnpm test:alerts
pnpm cf:alerts:binding-drift --ci
```
