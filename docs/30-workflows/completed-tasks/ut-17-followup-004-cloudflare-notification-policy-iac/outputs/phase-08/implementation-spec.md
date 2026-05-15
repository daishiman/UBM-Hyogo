# Phase 8 成果物: 実装本体仕様

Phase 8 spec: `../../phase-08.md`

実装は本タスクサイクル内で完了 (CONST_007 — 先送り禁止)。
ファイル一覧 (新規):

## 宣言ファイル

- `infra/cloudflare-alerts/quota-base.json`
- `infra/cloudflare-alerts/policies/{workers-requests,d1-read-queries,d1-write-queries,pages-build,r2-class-a}.json`
- `infra/cloudflare-alerts/webhooks/ut-17-relay.json`
- `infra/cloudflare-alerts/schema/{policy,webhook,quota-base}.schema.json`
- `infra/cloudflare-alerts/README.md`

## Node 純関数 + CLI

- `infra/cloudflare-alerts/lib/types.ts`
- `infra/cloudflare-alerts/lib/canonicalize.ts`
- `infra/cloudflare-alerts/lib/diff.ts`
- `infra/cloudflare-alerts/lib/resolve.ts`
- `infra/cloudflare-alerts/lib/quota-base.ts`
- `infra/cloudflare-alerts/lib/load.ts`
- `infra/cloudflare-alerts/lib/api-client.ts`
- `infra/cloudflare-alerts/lib/cli.ts`

## シェル統合

`scripts/cf.sh` に `alerts` 分岐を追加 (line 161 付近)。
list / diff / plan / apply の 4 サブコマンド + `--json` / `--yes` / `--ci` フラグ対応。
`tsx` 経由で `infra/cloudflare-alerts/lib/cli.ts` を exec。

## CI

`.github/workflows/cloudflare-alerts-drift.yml`
- schedule (毎月 1 日 00:00 UTC) + workflow_dispatch + pull_request
- `CLOUDFLARE_ALERTS_TOKEN_READ` 環境変数のみ使用 (read-only)
- `bash scripts/cf.sh alerts diff --ci --json` を実行、drift があれば fail

## モック

`infra/cloudflare-alerts/lib/api-client.ts` で `CF_ALERTS_MOCK_DIR` 環境変数を見て
fixture 経路に差し替え。write 系は write-log.txt に追記のみで実 API 不発火。

## webhook ID 直書き禁止の Schema 強制

`policy.schema.json` の `mechanisms.webhooks[]` items を
`additionalProperties:false` + `required:["name"]` で固定し、`id` キーの混入を拒否。

## 不変条件遵守

- wrangler 直接呼び出しなし (`cf.sh` の alerts 分岐内でも `tsx` のみ exec)
- threshold 絶対値の repo 直書きなし (`grep -E '"threshold":\s*[0-9]+' infra/cloudflare-alerts/policies/*.json` で 0 件)
- webhook id 直書きなし (Schema が拒否、policies/*.json は `{"name": "ut-17-relay"}` のみ)
- 実 token / 実 url の repo 混入なし (`.invalid` TLD placeholder のみ)
